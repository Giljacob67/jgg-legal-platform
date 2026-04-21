import { NextRequest } from "next/server";
import { z } from "zod";
import { requireRBAC } from "@/lib/api-auth";
import { auth } from "@/lib/auth";
import { resolverPerfilUsuario } from "@/modules/administracao/domain/types";
import {
  getRequestId,
  jsonError,
  jsonWithRequestId,
} from "@/lib/api-response";
import { getPeticoesOperacionalInfra } from "@/modules/peticoes/infrastructure/operacional/provider.server";
import { obterPedidoDePeca } from "@/modules/peticoes/application/obterPedidoDePeca";
import { responsavelObrigatorioAtendido } from "@/modules/peticoes/application/governanca-pedido";
import { perfilTemAlcadaAprovacao } from "@/modules/peticoes/domain/aprovacao";
import {
  criarEntradaRefAuditavel,
  registrarEventoPipeline,
  registrarFalhaPipeline,
} from "@/modules/peticoes/application/operacional/observabilidade-pipeline";

const AprovacaoPayloadSchema = z.object({
  resultado: z.enum(["aprovado", "rejeitado", "revisao_pendente"]),
  observacoes: z.string().optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ pedidoId: string }> },
) {
  const requestId = getRequestId(req);

  const forbidden = await requireRBAC("peticoes", "leitura");
  if (forbidden) return forbidden;

  const session = await auth();
  if (!session) {
    registrarEventoPipeline("api/pipeline/aprovacao", requestId, "aprovacao_bloqueada_nao_autenticado");
    return jsonError(requestId, "Não autorizado.", 401);
  }

  const { pedidoId } = await params;
  const perfilUsuario = resolverPerfilUsuario(session.user.role as string | undefined);
  const contextoAuditoria = {
    requestId,
    usuarioId: session.user.id,
    perfilUsuario,
  };

  registrarEventoPipeline("api/pipeline/aprovacao", requestId, "aprovacao_solicitada", {
    pedidoId,
    ...contextoAuditoria,
  });

  if (!perfilTemAlcadaAprovacao(perfilUsuario)) {
    registrarEventoPipeline("api/pipeline/aprovacao", requestId, "aprovacao_bloqueada_alcada", {
      pedidoId,
      ...contextoAuditoria,
    });
    return jsonError(requestId, "Seu perfil não possui alçada para aprovação final.", 403);
  }

  const pedido = await obterPedidoDePeca(pedidoId);
  if (!pedido) {
    registrarEventoPipeline("api/pipeline/aprovacao", requestId, "aprovacao_bloqueada_pedido_nao_encontrado", {
      pedidoId,
      ...contextoAuditoria,
    });
    return jsonError(requestId, "Pedido não encontrado.", 404);
  }
  if (!responsavelObrigatorioAtendido(pedido.responsavel)) {
    registrarEventoPipeline("api/pipeline/aprovacao", requestId, "aprovacao_bloqueada_sem_responsavel", {
      pedidoId,
      responsavel: pedido.responsavel,
      ...contextoAuditoria,
    });
    return jsonError(
      requestId,
      "Responsável obrigatório pendente. Defina o responsável do pedido antes de aprovar o pipeline.",
      422,
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    registrarEventoPipeline("api/pipeline/aprovacao", requestId, "aprovacao_bloqueada_payload_invalido", {
      pedidoId,
      ...contextoAuditoria,
    });
    return jsonError(requestId, "Corpo da requisição inválido.", 400);
  }

  const parsed = AprovacaoPayloadSchema.safeParse(body);
  if (!parsed.success) {
    registrarEventoPipeline("api/pipeline/aprovacao", requestId, "aprovacao_bloqueada_dados_invalidos", {
      pedidoId,
      ...contextoAuditoria,
    });
    return jsonError(
      requestId,
      "Dados inválidos.",
      400,
      { detalhes: parsed.error.flatten() },
    );
  }

  try {
    const { resultado, observacoes } = parsed.data;
    const infra = getPeticoesOperacionalInfra();
    registrarEventoPipeline("api/pipeline/aprovacao", requestId, "aprovacao_decisao_recebida", {
      pedidoId,
      resultado,
      ...contextoAuditoria,
    });
    const snapshot = await infra.pipelineSnapshotRepository.salvarNovaVersao({
      pedidoId,
      etapa: "aprovacao",
      entradaRef: criarEntradaRefAuditavel(
        { origem: "aprovacao_humana", aprovadoPor: session.user.id },
        contextoAuditoria,
      ),
      saidaEstruturada: {
        resultado,
        observacoes: observacoes ?? null,
        data_aprovacao: new Date().toISOString(),
        aprovado_por: session.user.id,
        perfil_aprovador: perfilUsuario,
      },
      status:
        resultado === "aprovado"
          ? "concluido"
          : resultado === "rejeitado"
            ? "erro"
            : "em_andamento",
      tentativa: 1,
    });

    registrarEventoPipeline("api/pipeline/aprovacao", requestId, "aprovacao_registrada", {
      pedidoId,
      resultado,
      ...contextoAuditoria,
    });

    return jsonWithRequestId(requestId, { snapshot, resultado }, { status: 200 });
  } catch (error) {
    registrarFalhaPipeline("api/pipeline/aprovacao", requestId, "aprovacao_falha", error, {
      pedidoId,
      ...contextoAuditoria,
    });
    return jsonError(requestId, "Erro ao registrar aprovação.", 500);
  }
}
