import { NextResponse } from "next/server";
import { streamText } from "ai";
import { getLLM, isAIAvailable } from "@/lib/ai/provider";
import { services } from "@/services/container";
import { requireSessionWithPermission } from "@/lib/api-auth";
import { apiError } from "@/lib/api-response";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ pedidoId: string }> }
) {
  const authResult = await requireSessionWithPermission({ modulo: "peticoes", acao: "execute" });
  if (authResult.response) return authResult.response;

  try {
    const { pedidoId } = await params;
    const body = await request.json();
    const { selecao, instrucao } = body as { selecao: string; instrucao: string };

    if (!selecao || !instrucao) {
      return apiError("VALIDATION_ERROR", "selecao e instrucao são obrigatórios.", 400);
    }

    const pedido = await services.peticoesRepository.obterPedidoPorId(pedidoId);
    if (!pedido) {
      return apiError("NOT_FOUND", `Pedido ${pedidoId} não encontrado.`, 404);
    }

    if (!isAIAvailable()) {
      return NextResponse.json({
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

    return result.toTextStreamResponse();

  } catch (error) {
    console.error("[AI Suggestion] Erro:", error);
    return apiError("INTERNAL_ERROR", error instanceof Error ? error.message : "Erro interno na sugestão de IA.", 500);
  }
}
