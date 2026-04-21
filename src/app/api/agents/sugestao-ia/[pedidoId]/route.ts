import { streamText } from "ai";
import { getLLM, isAIAvailable } from "@/lib/ai/provider";
import { services } from "@/services/container";
import { syncRuntimeAIConfig } from "@/lib/ai/runtime-config";
import { requireAuth } from "@/lib/api-auth";
import { auth } from "@/lib/auth";
import { verificarRateLimit } from "@/lib/rate-limit";
import {
  getRequestId,
  jsonError,
  jsonWithRequestId,
  logApiError,
  logApiInfo,
} from "@/lib/api-response";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ pedidoId: string }> }
) {
  const requestId = getRequestId(request);

  const unauth = await requireAuth();
  if (unauth) return unauth;
  const session = (await auth())!;

  const rl = verificarRateLimit(session.user.id, "agents-ia", 20);
  if (!rl.permitido) {
    const resetMin = Math.ceil(rl.resetEmMs / 60000);
    return jsonWithRequestId(
      requestId,
      {
        error: `Limite de chamadas de IA atingido. Tente novamente em ${resetMin} minuto(s).`,
      },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil(rl.resetEmMs / 1000)) },
      },
    );
  }

  try {
    const { pedidoId } = await params;
    const body = (await request.json()) as { selecao?: string; instrucao?: string };
    const { selecao, instrucao } = body as { selecao: string; instrucao: string };

    if (!selecao?.trim() || !instrucao?.trim()) {
      return jsonError(requestId, "selecao e instrucao são obrigatórios.", 400);
    }

    const pedido = await services.peticoesRepository.obterPedidoPorId(pedidoId);
    if (!pedido) {
      return jsonError(requestId, `Pedido ${pedidoId} não encontrado.`, 404);
    }

    logApiInfo("api/agents/sugestao-ia", requestId, "solicitacao recebida", {
      pedidoId,
      usuarioId: session.user.id,
    });

    await syncRuntimeAIConfig();
    if (!isAIAvailable()) {
      return jsonWithRequestId(requestId, {
        sugestao: `[Sugestão simulada] ${selecao}\n\n→ Reformulado conforme instrução: "${instrucao}". Configure OPENAI_API_KEY ou OPENROUTER_API_KEY para sugestões reais.`,
        aviso: "Nenhuma chave AI configurada",
      });
    }

    const result = streamText({
      model: getLLM(),
      system: `Você é um assistente jurídico especializado em redação de peças processuais brasileiras.
Você está auxiliando na redação de uma ${pedido.tipoPeca} para o pedido "${pedido.titulo}".
Responda APENAS com o texto reformulado, sem explicações, sem markdown, sem prefixos.
Preserve o estilo formal, jurídico e objetivo. Mantenha citações legais se presentes.
Use português jurídico brasileiro padrão.`,
      prompt: `Texto selecionado pelo advogado:\n"${selecao}"\n\nInstrução de melhoria:\n${instrucao}\n\nReformule o texto selecionado conforme a instrução:`,
      maxOutputTokens: 800,
    });

    const response = result.toTextStreamResponse();
    response.headers.set("X-Request-Id", requestId);
    return response;

  } catch (error) {
    logApiError("api/agents/sugestao-ia", requestId, error);
    return jsonError(
      requestId,
      error instanceof Error ? error.message : "Erro interno na sugestão de IA.",
      500,
    );
  }
}
