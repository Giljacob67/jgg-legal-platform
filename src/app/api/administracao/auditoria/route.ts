import { NextResponse } from "next/server";
import { requireSessionWithPermission } from "@/lib/api-auth";
import { apiError } from "@/lib/api-response";
import { listAuditLog, writeAuditLog } from "@/lib/security/audit-log";

export async function GET(request: Request) {
  const authResult = await requireSessionWithPermission({ modulo: "administracao", acao: "read" });
  if (authResult.response) return authResult.response;

  try {
    const { searchParams } = new URL(request.url);
    const limitRaw = Number(searchParams.get("limit") ?? "50");
    const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(200, Math.round(limitRaw))) : 50;
    const userId = searchParams.get("userId") ?? undefined;
    const resource = searchParams.get("resource") ?? undefined;

    const logs = await listAuditLog({ limit, userId, resource });

    await writeAuditLog({
      request,
      session: authResult.session,
      action: "read",
      resource: "administracao.audit_log",
      result: "success",
      details: { total: logs.length, limit, userId: userId ?? null, resource: resource ?? null },
    });

    return NextResponse.json({
      logs,
      total: logs.length,
      limit,
    });
  } catch (error) {
    return apiError(
      "INTERNAL_ERROR",
      error instanceof Error ? error.message : "Falha ao consultar trilha de auditoria.",
      500,
    );
  }
}
