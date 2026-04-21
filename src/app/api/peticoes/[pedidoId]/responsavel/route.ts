import { NextResponse } from "next/server";
import { requireAuth, requireRBAC } from "@/lib/api-auth";
import { services } from "@/services/container";

type Params = { params: Promise<{ pedidoId: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const unauth = await requireAuth();
  if (unauth) return unauth;

  const rbac = await requireRBAC("peticoes", "edicao");
  if (rbac) return rbac;

  const { pedidoId } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corpo da requisição inválido." }, { status: 400 });
  }

  const responsavel = (body as { responsavel?: string })?.responsavel?.trim();
  if (!responsavel) {
    return NextResponse.json({ error: "Campo 'responsavel' é obrigatório." }, { status: 400 });
  }

  const pedido = await services.peticoesRepository.atualizarResponsavel(pedidoId, responsavel);
  if (!pedido) {
    return NextResponse.json({ error: "Pedido não encontrado." }, { status: 404 });
  }

  return NextResponse.json({ pedido }, { status: 200 });
}
