import "server-only";

import { generateText } from "ai";
import { NextResponse } from "next/server";
import { getAIProvider, isAIAvailable } from "@/lib/ai/client";
import { buildDraftPrompt } from "@/lib/ai/prompts";
import { GerarMinutaAIPayloadSchema, parseOrError } from "@/lib/validation";

export async function POST(request: Request) {
  if (!isAIAvailable()) {
    return NextResponse.json(
      {
        success: false,
        errors: [
          "Motor de IA não disponível. Configure a variável OPENAI_API_KEY.",
        ],
      },
      { status: 503 },
    );
  }

  const body = await request.json();
  const parsed = parseOrError(GerarMinutaAIPayloadSchema, body);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, errors: parsed.errors },
      { status: 400 },
    );
  }

  const { pedidoId } = parsed.data;
  const provider = getAIProvider();

  if (!provider) {
    return NextResponse.json(
      { success: false, errors: ["Falha ao inicializar provider de IA."] },
      { status: 500 },
    );
  }

  try {
    const prompt = buildDraftPrompt({
      tipoPeca: parsed.data.tipoPecaCanonica ?? "peticao_inicial",
      materia: parsed.data.materiaCanonica ?? "civel",
      fatos: [
        "Fatos serão carregados do contexto jurídico do pedido " + pedidoId,
      ],
      estrategia: "Estratégia será carregada do contexto jurídico do pedido.",
      templateOrientacoes: "Seguir estrutura padrão do template selecionado.",
    });

    const result = await generateText({
      model: provider("gpt-4o-mini"),
      prompt,
      temperature: 0.3,
    });

    return NextResponse.json({
      success: true,
      data: {
        pedidoId,
        conteudo: result.text,
        tokensUsados: result.usage?.totalTokens ?? 0,
        modelo: "gpt-4o-mini",
        geradoEm: new Date().toISOString(),
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao gerar minuta com IA.";
    return NextResponse.json(
      { success: false, errors: [message] },
      { status: 500 },
    );
  }
}
