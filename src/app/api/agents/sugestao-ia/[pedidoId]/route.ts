import { NextResponse } from "next/server";
import { streamText } from "ai";
import { getLLM, isAIAvailable } from "@/lib/ai/provider";
import { services } from "@/services/container";
import { requireAuth } from "@/lib/api-auth";
import { auth } from "@/lib/auth";
import { verificarRateLimit } from "@/lib/rate-limit";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ pedidoId: string }> }
) {
  const unauth = await requireAuth();
  if (unauth) return unauth;
  const session = (await auth())!;

  const rl = verificarRateLimit(session.user.id, "agents-ia", 20);
  if (!rl.permitido) {
    const resetMin = Math.ceil(rl.resetEmMs / 60000);
    return NextResponse.json(
      { error: `Limite de chamadas de IA atingido. Tente novamente em ${resetMin} minuto(s).` },
      { status: 429, headers: { "Retry-After": String(Math.ceil(rl.resetEmMs / 1000)) } },
    );
  }

  try {
    const { pedidoId } = await params;
    const body = await request.json();
    const { selecao, instrucao } = body as { selecao: string; instrucao: string };

    if (!selecao || !instrucao) {
      return NextResponse.json(
        { error: "selecao e instrucao são obrigatórios." },
        { status: 400 }
      );
    }

    const pedido = await services.peticoesRepository.obterPedidoPorId(pedidoId);
    if (!pedido) {
      return NextResponse.json({ error: `Pedido ${pedidoId} não encontrado.` }, { status: 404 });
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
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro interno na sugestão de IA." },
      { status: 500 }
    );
  }
}
