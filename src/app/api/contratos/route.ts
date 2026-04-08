import { NextResponse } from "next/server";
import { listarContratos, criarContrato } from "@/modules/contratos/application";
import type { NovoContratoPayload, StatusContrato, TipoContrato } from "@/modules/contratos/domain/types";
import { requireSessionWithPermission } from "@/lib/api-auth";
import { apiError } from "@/lib/api-response";
import { writeAuditLog } from "@/lib/security/audit-log";
import { isPerfilPrivilegiado, resolverPerfilDaSessao } from "@/lib/authz";

export async function GET(request: Request) {
  const authResult = await requireSessionWithPermission({ modulo: "contratos", acao: "read" });
  if (authResult.response) return authResult.response;

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") ?? undefined;
    const tipo = searchParams.get("tipo") ?? undefined;
    const perfil = resolverPerfilDaSessao(authResult.session);
    const responsavelId = isPerfilPrivilegiado(perfil) ? undefined : authResult.session.user.id;
    const contratos = await listarContratos({
      status: status as StatusContrato | undefined,
      tipo: tipo as TipoContrato | undefined,
      responsavelId,
    });

    await writeAuditLog({
      request,
      session: authResult.session,
      action: "read",
      resource: "contratos",
      result: "success",
      details: { total: contratos.length },
    });

    return NextResponse.json({ contratos });
  } catch (error) {
    return apiError("INTERNAL_ERROR", error instanceof Error ? error.message : "Erro ao listar contratos.", 500);
  }
}

export async function POST(request: Request) {
  const authResult = await requireSessionWithPermission({ modulo: "contratos", acao: "write" });
  if (authResult.response) return authResult.response;

  try {
    const body = (await request.json()) as NovoContratoPayload;
    if (!body.titulo || !body.tipo || !body.objeto) {
      return apiError("VALIDATION_ERROR", "Campos obrigatórios: titulo, tipo e objeto.", 400);
    }
    const perfil = resolverPerfilDaSessao(authResult.session);
    const payload = isPerfilPrivilegiado(perfil)
      ? body
      : { ...body, responsavelId: authResult.session.user.id };
    const contrato = await criarContrato(payload);

    await writeAuditLog({
      request,
      session: authResult.session,
      action: "create",
      resource: "contratos",
      resourceId: contrato.id,
      result: "success",
    });

    return NextResponse.json({ contrato }, { status: 201 });
  } catch (error) {
    return apiError("INTERNAL_ERROR", error instanceof Error ? error.message : "Erro ao criar contrato.", 500);
  }
}
