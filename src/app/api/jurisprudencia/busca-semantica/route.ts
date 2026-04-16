import { NextResponse } from "next/server";
import { gerarEmbedding } from "@/lib/ai/embeddings";
import { buscaSemanticaJurisprudencia } from "@/modules/jurisprudencia/application";
import { requireAuth } from "@/lib/api-auth";

export async function POST(request: Request) {
  const unauth = await requireAuth();
  if (unauth) return unauth;

  try {
    const body = (await request.json()) as { query?: string; limite?: number };
    if (!body.query?.trim()) {
      return NextResponse.json({ error: "Campo 'query' obrigatório." }, { status: 400 });
    }

    const embedding = await gerarEmbedding(body.query);
    const jurisprudencias = await buscaSemanticaJurisprudencia(embedding, body.limite ?? 10);

    return NextResponse.json({ jurisprudencias, total: jurisprudencias.length, modo: "semantico" });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro na busca semântica.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
