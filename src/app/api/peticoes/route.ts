import { NextResponse } from "next/server";
import { services } from "@/services/container";
import { validarNovoPedidoSafe } from "@/modules/peticoes/domain/validarNovoPedidoPayload";
import type { NovoPedidoPayload } from "@/modules/peticoes/domain/types";
import { requireAuth, requireRBAC } from "@/lib/api-auth";

export async function POST(request: Request) {
  const unauth = await requireAuth();
  if (unauth) return unauth;

  const rbac = await requireRBAC("peticoes", "edicao");
  if (rbac) return rbac;

  try {
    const body = (await request.json()) as NovoPedidoPayload;
    const validacao = validarNovoPedidoSafe(body);
    if (!validacao.success) {
      return NextResponse.json(
        { error: validacao.errors[0] ?? "Dados inválidos.", errors: validacao.errors },
        { status: 400 },
      );
    }
    const pedido = await services.peticoesRepository.criarPedidoDePeca(validacao.data);
    return NextResponse.json({ pedido }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao criar pedido." },
      { status: 500 }
    );
  }
}
