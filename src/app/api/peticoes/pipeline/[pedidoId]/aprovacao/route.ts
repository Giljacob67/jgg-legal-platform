import { NextRequest } from "next/server";
import { z } from "zod";
import { requireRBAC } from "@/lib/api-auth";
import { auth } from "@/lib/auth";
import { resolverPerfilUsuario } from "@/modules/administracao/domain/types";
import {
  getRequestId,
  jsonError,
  jsonWithRequestId,
  logApiError,
  logApiInfo,
} from "@/lib/api-response";
import { getPeticoesOperacionalInfra } from "@/modules/peticoes/infrastructure/operacional/provider.server";
import { obterPedidoDePeca } from "@/modules/peticoes/application/obterPedidoDePeca";
import { responsavelObrigatorioAtendido } from "@/modules/peticoes/application/governanca-pedido";
import { perfilTemAlcadaAprovacao } from "@/modules/peticoes/domain/aprovacao";

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
    return jsonError(requestId, "Não autorizado.", 401);
  }

  const { pedidoId } = await params;
  const perfilUsuario = resolverPerfilUsuario(session.user.role as string | undefined);

  if (!perfilTemAlcadaAprovacao(perfilUsuario)) {
    return jsonError(requestId, "Seu perfil não possui alçada para aprovação final.", 403);
  }

  const pedido = await obterPedidoDePeca(pedidoId);
  if (!pedido) {
    return jsonError(requestId, "Pedido não encontrado.", 404);
  }
  if (!responsavelObrigatorioAtendido(pedido.responsavel)) {
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
    return jsonError(requestId, "Corpo da requisição inválido.", 400);
  }

  const parsed = AprovacaoPayloadSchema.safeParse(body);
  if (!parsed.success) {
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
    const snapshot = await infra.pipelineSnapshotRepository.salvarNovaVersao({
      pedidoId,
      etapa: "aprovacao",
      entradaRef: { origem: "aprovacao_humana", aprovadoPor: session.user.id },
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

    logApiInfo("api/pipeline/aprovacao", requestId, "aprovacao registrada", {
      pedidoId,
      resultado,
      usuarioId: session.user.id,
    });

    return jsonWithRequestId(requestId, { snapshot, resultado }, { status: 200 });
  } catch (error) {
    logApiError("api/pipeline/aprovacao", requestId, error, {
      pedidoId,
      usuarioId: session.user.id,
    });
    return jsonError(requestId, "Erro ao registrar aprovação.", 500);
  }
}
