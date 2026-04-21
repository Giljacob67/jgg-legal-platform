import { NextResponse } from "next/server";
import { requireAuth, requireRBAC } from "@/lib/api-auth";
import { listarCasos } from "@/modules/casos/application/listarCasos";
import { atualizarCaso } from "@/modules/casos/application/atualizarCaso";
import { excluirCaso } from "@/modules/casos/application/excluirCaso";
import type { AtualizarCasoPayload } from "@/modules/casos/application/contracts";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ casoId: string }> },
) {
  const unauth = await requireAuth();
  if (unauth) return unauth;

  try {
    const { casoId } = await params;
    const casosList = await listarCasos();
    const caso = casosList.find((c) => c.id === casoId);
    if (!caso) {
      return NextResponse.json({ error: "Caso não encontrado." }, { status: 404 });
    }
    return NextResponse.json({ caso });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao buscar caso." },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ casoId: string }> },
) {
  const unauth = await requireAuth();
  if (unauth) return unauth;

  const rbac = await requireRBAC("casos", "edicao");
  if (rbac) return rbac;

  try {
    const { casoId } = await params;
    const body = (await request.json()) as AtualizarCasoPayload;

    const caso = await atualizarCaso(casoId, body);
    return NextResponse.json({ caso });
  } catch (error) {
    const status = error instanceof Error && error.message.includes("não encontrado") ? 404 : 500;
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao atualizar caso." },
      { status },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ casoId: string }> },
) {
  const unauth = await requireAuth();
  if (unauth) return unauth;

  const rbac = await requireRBAC("casos", "total");
  if (rbac) return rbac;

  try {
    const { casoId } = await params;
    await excluirCaso(casoId);
    return NextResponse.json({ success: true });
  } catch (error) {
    const status = error instanceof Error && error.message.includes("não encontrado") ? 404 : 500;
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao excluir caso." },
      { status },
    );
  }
}
