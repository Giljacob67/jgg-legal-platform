import { NextResponse } from "next/server";
import { listarClientes, criarCliente } from "@/modules/clientes/application";
import type { NovoClientePayload, StatusCliente } from "@/modules/clientes/domain/types";
import { requireAuth, requireRBAC } from "@/lib/api-auth";

export async function GET(request: Request) {
  const unauth = await requireAuth();
  if (unauth) return unauth;

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") ?? undefined;
    const clientes = await listarClientes({ status: status as StatusCliente | undefined });
    return NextResponse.json({ clientes });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erro ao listar clientes." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const unauth = await requireAuth();
  if (unauth) return unauth;

  const rbac = await requireRBAC("clientes", "edicao");
  if (rbac) return rbac;

  try {
    const body = (await request.json()) as NovoClientePayload;
    if (!body.nome || !body.tipo) return NextResponse.json({ error: "nome e tipo são obrigatórios." }, { status: 400 });
    const cliente = await criarCliente(body);
    return NextResponse.json({ cliente }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erro." }, { status: 500 });
  }
}
