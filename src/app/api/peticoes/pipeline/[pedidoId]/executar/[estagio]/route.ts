import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAIAvailable } from "@/lib/ai/client";
import {
  executarEstagioComIA,
  type EstagioExecutavel,
} from "@/modules/peticoes/application/operacional/executarEstagioComIA";

export const maxDuration = 300; // Vercel Pro: até 300s para streaming

const ESTAGIOS_VALIDOS: EstagioExecutavel[] = [
  "triagem",
  "extracao-fatos",
  "analise-adversa",
  "estrategia",
  "minuta",
];

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ pedidoId: string; estagio: string }> },
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  if (!isAIAvailable()) {
    return NextResponse.json(
      { error: "IA não configurada. Defina OPENROUTER_API_KEY." },
      { status: 503 },
    );
  }

  const { pedidoId, estagio } = await params;

  if (!ESTAGIOS_VALIDOS.includes(estagio as EstagioExecutavel)) {
    return NextResponse.json(
      {
        error: `Estágio inválido: ${estagio}. Válidos: ${ESTAGIOS_VALIDOS.join(", ")}`,
      },
      { status: 400 },
    );
  }

  try {
    const stream = await executarEstagioComIA(
      pedidoId,
      estagio as EstagioExecutavel,
      (pipeline) => ({
        system: "Você é um assistente jurídico especializado em direito brasileiro.",
        prompt: `Execute o estágio "${estagio}" para o pedido ${pedidoId}. Contexto atual: ${JSON.stringify(pipeline.contextoAtual ?? {}, null, 2)}`,
      }),
    );

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "X-Accel-Buffering": "no",
        "Cache-Control": "no-cache",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro interno";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
