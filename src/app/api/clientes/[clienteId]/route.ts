import { NextResponse } from "next/server";
import { obterClientePorId, atualizarCliente } from "@/modules/clientes/application";
import type { NovoClientePayload } from "@/modules/clientes/domain/types";
import { requireSessionWithPermission } from "@/lib/api-auth";
import { apiError } from "@/lib/api-response";
import { writeAuditLog } from "@/lib/security/audit-log";
import { requireResourceScope } from "@/lib/authz";

type Params = { params: Promise<{ clienteId: string }> };

export async function GET(request: Request, { params }: Params) {
  const authResult = await requireSessionWithPermission({ modulo: "clientes", acao: "read" });
  if (authResult.response) return authResult.response;

  const { clienteId } = await params;
  const cliente = await obterClientePorId(clienteId);
  if (!cliente) {
    return apiError("NOT_FOUND", "Cliente não encontrado.", 404);
  }
  const scopeDenied = requireResourceScope({
    session: authResult.session,
    ownerUserId: cliente.responsavelId,
  });
  if (scopeDenied) {
    return scopeDenied;
  }

  await writeAuditLog({
    request,
    session: authResult.session,
    action: "read",
    resource: "clientes",
    resourceId: clienteId,
    result: "success",
  });

  return NextResponse.json({ cliente });
}

export async function PATCH(request: Request, { params }: Params) {
  const authResult = await requireSessionWithPermission({ modulo: "clientes", acao: "write" });
  if (authResult.response) return authResult.response;

  const { clienteId } = await params;
  try {
    const body = (await request.json()) as Partial<NovoClientePayload>;
    const atual = await obterClientePorId(clienteId);
    if (!atual) {
      return apiError("NOT_FOUND", "Cliente não encontrado.", 404);
    }
    const scopeDenied = requireResourceScope({
      session: authResult.session,
      ownerUserId: atual.responsavelId,
    });
    if (scopeDenied) {
      return scopeDenied;
    }
    const cliente = await atualizarCliente(clienteId, body);

    await writeAuditLog({
      request,
      session: authResult.session,
      action: "update",
      resource: "clientes",
      resourceId: clienteId,
      result: "success",
    });

    return NextResponse.json({ cliente });
  } catch (error) {
    return apiError("INTERNAL_ERROR", error instanceof Error ? error.message : "Erro ao atualizar cliente.", 500);
  }
}
