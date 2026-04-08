import { NextResponse } from "next/server";
import { atualizarStatusAtivoBaseJuridica, type TipoGestaoBaseJuridica } from "@/modules/peticoes/base-juridica-viva/application/useCases";
import { requireSessionWithPermission } from "@/lib/api-auth";
import { apiError } from "@/lib/api-response";
import { writeAuditLog } from "@/lib/security/audit-log";

function tipoValido(tipo: string): tipo is TipoGestaoBaseJuridica {
  return tipo === "templates" || tipo === "teses" || tipo === "checklists";
}

function statusValido(status: string): status is "ativo" | "inativo" {
  return status === "ativo" || status === "inativo";
}

export async function POST(
  request: Request,
  context: { params: Promise<Record<string, string>> },
) {
  const authResult = await requireSessionWithPermission({ modulo: "peticoes", acao: "write" });
  if (authResult.response) return authResult.response;

  try {
    const params = await context.params;
    const tipo = params.tipo;
    const ativoId = params.ativoId;

    if (!tipoValido(tipo)) {
      return apiError("VALIDATION_ERROR", "Tipo de ativo inválido.", 400);
    }

    const formData = await request.formData();
    const statusRaw = String(formData.get("status") ?? "");
    const redirectTo = String(formData.get("redirectTo") ?? "/peticoes/base-juridica");

    if (!statusValido(statusRaw)) {
      return apiError("VALIDATION_ERROR", "Status inválido.", 400);
    }

    await atualizarStatusAtivoBaseJuridica({
      tipo,
      id: ativoId,
      status: statusRaw,
    });

    await writeAuditLog({
      request,
      session: authResult.session,
      action: "update",
      resource: "peticoes.base-juridica.status",
      resourceId: `${tipo}:${ativoId}`,
      result: "success",
      details: { status: statusRaw },
    });

    return NextResponse.redirect(new URL(redirectTo, request.url), 303);
  } catch (error) {
    return apiError(
      "INTERNAL_ERROR",
      error instanceof Error ? error.message : "Falha ao atualizar status do ativo jurídico.",
      500,
    );
  }
}
