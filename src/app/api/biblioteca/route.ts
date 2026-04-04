import { NextResponse } from "next/server";
import { getBibliotecaRepo } from "@/modules/biblioteca-conhecimento/infrastructure/mockBibliotecaRepository";
import type { TipoDocumentoBC, StatusEmbedding } from "@/modules/biblioteca-conhecimento/domain/types";
import { requireAuth } from "@/lib/api-auth";

export async function GET(request: Request) {
  const unauth = await requireAuth();
  if (unauth) return unauth;

  const { searchParams } = new URL(request.url);
  const tipo = searchParams.get("tipo") as TipoDocumentoBC | null;
  const fonte = searchParams.get("fonte") ?? undefined;
  const status = searchParams.get("status") ?? undefined;

  const repo = getBibliotecaRepo();
  const [documentos, stats] = await Promise.all([
    repo.listar({ tipo: tipo ?? undefined, fonte, status: status as StatusEmbedding | undefined }),
    repo.contar(),
  ]);

  return NextResponse.json({ documentos, stats });
}

export async function DELETE(request: Request) {
  const unauth = await requireAuth();
  if (unauth) return unauth;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id obrigatório." }, { status: 400 });

  const repo = getBibliotecaRepo();
  await repo.remover(id);
  return NextResponse.json({ ok: true });
}
