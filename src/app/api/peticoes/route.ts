import { NextResponse } from "next/server";
import { services } from "@/services/container";
import { validarNovoPedidoPayload } from "@/modules/peticoes/domain/validarNovoPedidoPayload";
import type { NovoPedidoPayload } from "@/modules/peticoes/domain/types";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as NovoPedidoPayload;
    validarNovoPedidoPayload(body);
    const pedido = await services.peticoesRepository.simularCriacaoPedido(body);
    return NextResponse.json({ pedido }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao criar pedido." },
      { status: 500 }
    );
  }
}
