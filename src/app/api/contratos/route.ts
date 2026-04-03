import { NextResponse } from "next/server";
import { listarContratos, criarContrato } from "@/modules/contratos/application";
import type { NovoCOntratoPPayload } from "@/modules/contratos/domain/types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") ?? undefined;
  const tipo = searchParams.get("tipo") ?? undefined;
  const contratos = await listarContratos({
    status: status as never,
    tipo: tipo as never,
  });
  return NextResponse.json({ contratos });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as NovoCOntratoPPayload;
    if (!body.titulo || !body.tipo || !body.objeto) {
      return NextResponse.json({ error: "titulo, tipo e objeto são obrigatórios." }, { status: 400 });
    }
    const contrato = await criarContrato(body);
    return NextResponse.json({ contrato }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erro." }, { status: 500 });
  }
}
