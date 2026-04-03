import { NextResponse } from "next/server";
import { listarJurisprudencias, pesquisarJurisprudencias, criarJurisprudencia } from "@/modules/jurisprudencia/application";
import type { TipoDecisao, Jurisprudencia } from "@/modules/jurisprudencia/domain/types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");
  const tribunal = searchParams.get("tribunal") ?? undefined;
  const tipo = searchParams.get("tipo") as TipoDecisao | null;
  const materia = searchParams.get("materia") ?? undefined;

  const jurisprudencias = q
    ? await pesquisarJurisprudencias(q)
    : await listarJurisprudencias({ tribunal, tipo: tipo ?? undefined, materia });

  return NextResponse.json({ jurisprudencias, total: jurisprudencias.length });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Omit<Jurisprudencia, "id" | "criadoEm">;
    if (!body.titulo || !body.ementa || !body.tribunal) {
      return NextResponse.json({ error: "titulo, ementa e tribunal são obrigatórios." }, { status: 400 });
    }
    const jurisprudencia = await criarJurisprudencia(body);
    return NextResponse.json({ jurisprudencia }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erro." }, { status: 500 });
  }
}
