import { NextResponse } from "next/server";
import { requireSessionWithPermission } from "@/lib/api-auth";
import { apiError } from "@/lib/api-response";
import { listAuditLog, writeAuditLog, type AuditAction, type AuditResult } from "@/lib/security/audit-log";

const AUDIT_ACTIONS: AuditAction[] = [
  "read",
  "create",
  "update",
  "delete",
  "download",
  "upload",
  "execute",
  "approve",
];
const AUDIT_RESULTS: AuditResult[] = ["success", "error", "denied"];

export async function GET(request: Request) {
  const authResult = await requireSessionWithPermission({ modulo: "administracao", acao: "read" });
  if (authResult.response) return authResult.response;

  try {
    const { searchParams } = new URL(request.url);
    const limitRaw = Number(searchParams.get("limit") ?? "50");
    const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(200, Math.round(limitRaw))) : 50;
    const userId = searchParams.get("userId") ?? undefined;
    const resource = searchParams.get("resource") ?? undefined;
    const actionRaw = searchParams.get("action");
    const resultRaw = searchParams.get("result");

    if (actionRaw && !AUDIT_ACTIONS.includes(actionRaw as AuditAction)) {
      return apiError("VALIDATION_ERROR", "Filtro 'action' inválido.", 400, { action: actionRaw });
    }
    if (resultRaw && !AUDIT_RESULTS.includes(resultRaw as AuditResult)) {
      return apiError("VALIDATION_ERROR", "Filtro 'result' inválido.", 400, { result: resultRaw });
    }

    const action =
      actionRaw && AUDIT_ACTIONS.includes(actionRaw as AuditAction)
        ? (actionRaw as AuditAction)
        : undefined;
    const result =
      resultRaw && AUDIT_RESULTS.includes(resultRaw as AuditResult)
        ? (resultRaw as AuditResult)
        : undefined;

    const logs = await listAuditLog({ limit, userId, resource, action, result });

    await writeAuditLog({
      request,
      session: authResult.session,
      action: "read",
      resource: "administracao.audit_log",
      result: "success",
      details: {
        total: logs.length,
        limit,
        userId: userId ?? null,
        resource: resource ?? null,
        action: action ?? null,
        result: result ?? null,
      },
    });

    return NextResponse.json({
      logs,
      total: logs.length,
      limit,
      filters: {
        userId: userId ?? null,
        resource: resource ?? null,
        action: action ?? null,
        result: result ?? null,
      },
    });
  } catch (error) {
    return apiError(
      "INTERNAL_ERROR",
      error instanceof Error ? error.message : "Falha ao consultar trilha de auditoria.",
      500,
    );
  }
}
