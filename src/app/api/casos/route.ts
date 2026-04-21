import { NextResponse } from "next/server";
import { requireAuth, requireRBAC } from "@/lib/api-auth";
import { listarCasos } from "@/modules/casos/application/listarCasos";
import { criarCaso } from "@/modules/casos/application/criarCaso";
import type { NovoCasoPayload } from "@/modules/casos/application/contracts";

export async function GET() {
  const unauth = await requireAuth();
  if (unauth) return unauth;

  try {
    const casosList = await listarCasos();
    return NextResponse.json({ casos: casosList });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao listar casos." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const unauth = await requireAuth();
  if (unauth) return unauth;

  const rbac = await requireRBAC("casos", "edicao");
  if (rbac) return rbac;

  try {
    const body = (await request.json()) as NovoCasoPayload;
    if (!body.titulo || !body.cliente || !body.materia) {
      return NextResponse.json(
        { error: "Campos obrigatórios: titulo, cliente, materia." },
        { status: 400 },
      );
    }
    const caso = await criarCaso(body);
    return NextResponse.json({ caso }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao criar caso." },
      { status: 500 },
    );
  }
}
