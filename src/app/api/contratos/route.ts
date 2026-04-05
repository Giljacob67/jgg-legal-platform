import { NextResponse } from "next/server";
import { listarContratos, criarContrato } from "@/modules/contratos/application";
import type { NovoContratoPayload, StatusContrato, TipoContrato } from "@/modules/contratos/domain/types";
import { requireAuth } from "@/lib/api-auth";

export async function GET(request: Request) {
  const unauth = await requireAuth();
  if (unauth) return unauth;

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") ?? undefined;
    const tipo = searchParams.get("tipo") ?? undefined;
    const contratos = await listarContratos({
      status: status as StatusContrato | undefined,
      tipo: tipo as TipoContrato | undefined,
    });
    return NextResponse.json({ contratos });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erro ao listar contratos." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const unauth = await requireAuth();
  if (unauth) return unauth;

  try {
    const body = (await request.json()) as NovoContratoPayload;
    if (!body.titulo || !body.tipo || !body.objeto) {
      return NextResponse.json({ error: "titulo, tipo e objeto são obrigatórios." }, { status: 400 });
    }
    const contrato = await criarContrato(body);
    return NextResponse.json({ contrato }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erro." }, { status: 500 });
  }
}
