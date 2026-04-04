import { NextResponse } from "next/server";
import { obterClientePorId, atualizarCliente } from "@/modules/clientes/application";
import type { NovoClientePayload } from "@/modules/clientes/domain/types";
import { requireAuth } from "@/lib/api-auth";

type Params = { params: Promise<{ clienteId: string }> };

export async function GET(_req: Request, { params }: Params) {
  const unauth = await requireAuth();
  if (unauth) return unauth;

  const { clienteId } = await params;
  const cliente = await obterClientePorId(clienteId);
  if (!cliente) return NextResponse.json({ error: "Cliente não encontrado." }, { status: 404 });
  return NextResponse.json({ cliente });
}

export async function PATCH(request: Request, { params }: Params) {
  const unauth = await requireAuth();
  if (unauth) return unauth;

  const { clienteId } = await params;
  try {
    const body = (await request.json()) as Partial<NovoClientePayload>;
    const cliente = await atualizarCliente(clienteId, body);
    return NextResponse.json({ cliente });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erro." }, { status: 500 });
  }
}
