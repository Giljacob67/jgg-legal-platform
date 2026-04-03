import { NextResponse } from "next/server";
import { obterClientePorId, atualizarCliente } from "@/modules/clientes/application";
import type { NovoCLientePayload } from "@/modules/clientes/domain/types";

type Params = { params: Promise<{ clienteId: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { clienteId } = await params;
  const cliente = await obterClientePorId(clienteId);
  if (!cliente) return NextResponse.json({ error: "Cliente não encontrado." }, { status: 404 });
  return NextResponse.json({ cliente });
}

export async function PATCH(request: Request, { params }: Params) {
  const { clienteId } = await params;
  try {
    const body = (await request.json()) as Partial<NovoCLientePayload>;
    const cliente = await atualizarCliente(clienteId, body);
    return NextResponse.json({ cliente });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erro." }, { status: 500 });
  }
}
