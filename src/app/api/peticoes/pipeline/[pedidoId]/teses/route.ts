import { NextRequest } from "next/server";
import { z } from "zod";
import { requireRBAC } from "@/lib/api-auth";
import { auth } from "@/lib/auth";
import { getRequestId, jsonError, jsonWithRequestId } from "@/lib/api-response";
import { getPeticoesOperacionalInfra } from "@/modules/peticoes/infrastructure/operacional/provider.server";
import { existeValidacaoHumanaPendente } from "@/modules/peticoes/application/teses-juridicas";

const RegistrarTesePayloadSchema = z.object({
  acao: z.literal("registrar_tese"),
  teseId: z.string().optional(),
  origem: z.enum(["ia", "usuario"]).default("usuario"),
  titulo: z.string().min(3),
  descricao: z.string().min(10),
  fundamentos: z.array(z.string().min(3)).min(1),
  documentosRelacionados: z.array(z.string()).optional(),
  statusValidacao: z.enum(["aprovada", "rejeitada", "ajustada"]),
  observacoesHumanas: z.string().optional(),
});

function gerarIdTeseManual(pedidoId: string): string {
  return `TSE-${pedidoId}-${Date.now().toString(36).toUpperCase()}`;
}

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

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError(requestId, "Corpo da requisição inválido.", 400);
  }

  const parsed = RegistrarTesePayloadSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(requestId, "Dados inválidos.", 400, { detalhes: parsed.error.flatten() });
  }

  const infra = getPeticoesOperacionalInfra();
  const contextoAtual = await infra.contextoJuridicoPedidoRepository.obterUltimaVersao(pedidoId);

  if (!contextoAtual) {
    return jsonError(
      requestId,
      "Contexto jurídico ainda não foi consolidado. Execute a estratégia jurídica antes de validar teses.",
      422,
    );
  }

  const payload = parsed.data;
  const teseExistente = payload.teseId
    ? contextoAtual.teses.find((tese) => tese.id === payload.teseId)
    : null;

  if (payload.teseId && !teseExistente) {
    return jsonError(requestId, "Tese não encontrada na versão atual do contexto.", 404);
  }

  const teseAtualizada = {
    id: teseExistente?.id ?? gerarIdTeseManual(pedidoId),
    titulo: payload.titulo.trim(),
    descricao: payload.descricao.trim(),
    fundamentos: payload.fundamentos.map((item) => item.trim()).filter(Boolean),
    documentosRelacionados: payload.documentosRelacionados ?? teseExistente?.documentosRelacionados ?? [],
    origem: teseExistente?.origem ?? payload.origem,
    statusValidacao: payload.statusValidacao,
    observacoesHumanas: payload.observacoesHumanas?.trim() || undefined,
    confirmadaPor: session.user.id,
    confirmadaEm: new Date().toISOString(),
  } as const;

  const teses = payload.teseId
    ? contextoAtual.teses.map((tese) => (tese.id === payload.teseId ? teseAtualizada : tese))
    : [...contextoAtual.teses, teseAtualizada];

  const contextoAtualizado = await infra.contextoJuridicoPedidoRepository.salvarNovaVersao({
    pedidoId: contextoAtual.pedidoId,
    versaoContexto: contextoAtual.versaoContexto + 1,
    fatosRelevantes: contextoAtual.fatosRelevantes,
    cronologia: contextoAtual.cronologia,
    pontosControvertidos: contextoAtual.pontosControvertidos,
    documentosChave: contextoAtual.documentosChave,
    referenciasDocumentais: contextoAtual.referenciasDocumentais,
    estrategiaSugerida: contextoAtual.estrategiaSugerida,
    teses,
    validacaoHumanaTesesPendente: existeValidacaoHumanaPendente(teses),
    fontesSnapshot: contextoAtual.fontesSnapshot,
  });

  return jsonWithRequestId(
    requestId,
    {
      contexto: contextoAtualizado,
      tese: teseAtualizada,
    },
    { status: 200 },
  );
}
