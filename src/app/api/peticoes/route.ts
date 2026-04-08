import { NextResponse } from "next/server";
import { services } from "@/services/container";
import { validarNovoPedidoPayload } from "@/modules/peticoes/domain/validarNovoPedidoPayload";
import type { NovoPedidoPayload } from "@/modules/peticoes/domain/types";
import { requireSessionWithPermission } from "@/lib/api-auth";
import { apiError } from "@/lib/api-response";
import { writeAuditLog } from "@/lib/security/audit-log";

export async function POST(request: Request) {
  const authResult = await requireSessionWithPermission({ modulo: "peticoes", acao: "write" });
  if (authResult.response) return authResult.response;

  try {
    const body = (await request.json()) as NovoPedidoPayload;
    validarNovoPedidoPayload(body);
    const pedido = await services.peticoesRepository.simularCriacaoPedido(body);
    await writeAuditLog({
      request,
      session: authResult.session,
      action: "create",
      resource: "peticoes",
      resourceId: pedido.id,
      result: "success",
    });
    return NextResponse.json({ pedido }, { status: 201 });
  } catch (error) {
    return apiError("INTERNAL_ERROR", error instanceof Error ? error.message : "Erro ao criar pedido.", 500);
  }
}
