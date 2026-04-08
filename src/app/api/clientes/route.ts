import { NextResponse } from "next/server";
import { listarClientes, criarCliente } from "@/modules/clientes/application";
import type { NovoClientePayload, StatusCliente } from "@/modules/clientes/domain/types";
import { requireSessionWithPermission } from "@/lib/api-auth";
import { apiError } from "@/lib/api-response";
import { writeAuditLog } from "@/lib/security/audit-log";
import { isPerfilPrivilegiado, resolverPerfilDaSessao } from "@/lib/authz";

export async function GET(request: Request) {
  const authResult = await requireSessionWithPermission({ modulo: "clientes", acao: "read" });
  if (authResult.response) return authResult.response;

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") ?? undefined;
    const perfil = resolverPerfilDaSessao(authResult.session);
    const responsavelId = isPerfilPrivilegiado(perfil) ? undefined : authResult.session.user.id;
    const clientes = await listarClientes({
      status: status as StatusCliente | undefined,
      responsavelId,
    });

    await writeAuditLog({
      request,
      session: authResult.session,
      action: "read",
      resource: "clientes",
      result: "success",
      details: { total: clientes.length },
    });

    return NextResponse.json({ clientes });
  } catch (error) {
    return apiError("INTERNAL_ERROR", error instanceof Error ? error.message : "Erro ao listar clientes.", 500);
  }
}

export async function POST(request: Request) {
  const authResult = await requireSessionWithPermission({ modulo: "clientes", acao: "write" });
  if (authResult.response) return authResult.response;

  try {
    const body = (await request.json()) as NovoClientePayload;
    if (!body.nome || !body.tipo) {
      return apiError("VALIDATION_ERROR", "Campos obrigatórios: nome e tipo.", 400);
    }
    const perfil = resolverPerfilDaSessao(authResult.session);
    const payload = isPerfilPrivilegiado(perfil)
      ? body
      : { ...body, responsavelId: authResult.session.user.id };
    const cliente = await criarCliente(payload);

    await writeAuditLog({
      request,
      session: authResult.session,
      action: "create",
      resource: "clientes",
      resourceId: cliente.id,
      result: "success",
    });

    return NextResponse.json({ cliente }, { status: 201 });
  } catch (error) {
    return apiError("INTERNAL_ERROR", error instanceof Error ? error.message : "Erro ao criar cliente.", 500);
  }
}
