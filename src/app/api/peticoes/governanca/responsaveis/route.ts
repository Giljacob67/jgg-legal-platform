import { NextResponse } from "next/server";
import { requireAuth, requireRBAC } from "@/lib/api-auth";
import { listarPedidosDePeca } from "@/modules/peticoes/application/listarPedidosDePeca";
import { listarAlertasGovernancaPorResponsavel } from "@/modules/peticoes/application/listarAlertasGovernancaPorResponsavel";

export async function GET() {
  const unauth = await requireAuth();
  if (unauth) return unauth;

  const rbac = await requireRBAC("peticoes", "leitura");
  if (rbac) return rbac;

  const pedidos = await listarPedidosDePeca();
  const resumo = listarAlertasGovernancaPorResponsavel(pedidos);

  return NextResponse.json(resumo, { status: 200 });
}
