import { NextResponse } from "next/server";
import { gerarEmbedding } from "@/lib/ai/embeddings";
import {
  listarPendentesIndexacao,
  salvarEmbeddingJurisprudencia,
} from "@/modules/jurisprudencia/application";
import { requireAuth } from "@/lib/api-auth";

/**
 * POST /api/jurisprudencia/indexar-todos
 * Gera embeddings para todos os registros com embedding_status = 'pendente'.
 * Processa em lote de até 50 por chamada (use múltiplas chamadas para reprocessar tudo).
 */
export async function POST(request: Request) {
  const unauth = await requireAuth();
  if (unauth) return unauth;

  try {
    const body = (await request.json().catch(() => ({}))) as { limite?: number };
    const pendentes = await listarPendentesIndexacao(body.limite ?? 50);

    if (pendentes.length === 0) {
      return NextResponse.json({ indexados: 0, mensagem: "Nenhum registro pendente de indexação." });
    }

    const resultados: { id: string; status: "ok" | "erro"; erro?: string }[] = [];

    for (const jd of pendentes) {
      try {
        // Texto indexado: título + ementa + tese (se houver) + matérias
        const texto = [
          jd.titulo,
          jd.ementa,
          jd.tese,
          jd.materias.join(", "),
          jd.fundamentosLegais.join(", "),
        ]
          .filter(Boolean)
          .join("\n\n");

        const embedding = await gerarEmbedding(texto);
        await salvarEmbeddingJurisprudencia(jd.id, embedding);
        resultados.push({ id: jd.id, status: "ok" });
      } catch (err) {
        resultados.push({
          id: jd.id,
          status: "erro",
          erro: err instanceof Error ? err.message : "erro desconhecido",
        });
      }
    }

    const ok = resultados.filter((r) => r.status === "ok").length;
    const erros = resultados.filter((r) => r.status === "erro").length;

    return NextResponse.json({ indexados: ok, erros, detalhes: resultados });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro ao indexar.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
