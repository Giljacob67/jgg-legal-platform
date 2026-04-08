import "server-only";

import type { Session } from "next-auth";
import { getDataMode } from "@/lib/data-mode";
import { getSqlClient } from "@/lib/database/client";

export type AuditAction =
  | "read"
  | "create"
  | "update"
  | "delete"
  | "download"
  | "upload"
  | "execute"
  | "approve";

type RequestLike = Request | { headers: Headers };

export type AuditLogEntry = {
  id: string;
  userId: string;
  userEmail: string | null;
  userRole: string | null;
  action: AuditAction;
  resource: string;
  resourceId: string | null;
  result: "success" | "error" | "denied";
  details: Record<string, unknown>;
  ip: string | null;
  userAgent: string | null;
  createdAt: string;
};

const MOCK_AUDIT_STORE_KEY = "__jgg_mock_audit_log_store__";

function getMockAuditStore(): AuditLogEntry[] {
  const globalStore = globalThis as typeof globalThis & { [MOCK_AUDIT_STORE_KEY]?: AuditLogEntry[] };
  if (!globalStore[MOCK_AUDIT_STORE_KEY]) {
    globalStore[MOCK_AUDIT_STORE_KEY] = [];
  }
  return globalStore[MOCK_AUDIT_STORE_KEY];
}

function extractRequestMeta(request?: RequestLike): { ip: string | null; userAgent: string | null } {
  if (!request) {
    return { ip: null, userAgent: null };
  }

  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const ip = forwardedFor?.split(",")[0]?.trim() ?? realIp ?? null;
  const userAgent = request.headers.get("user-agent");

  return { ip, userAgent };
}

export async function writeAuditLog(input: {
  request?: RequestLike;
  session: Session;
  action: AuditAction;
  resource: string;
  resourceId?: string;
  result: "success" | "error" | "denied";
  details?: Record<string, unknown>;
}): Promise<void> {
  const { request, session, action, resource, resourceId, result, details } = input;
  const { ip, userAgent } = extractRequestMeta(request);

  if (getDataMode() !== "real") {
    const entry: AuditLogEntry = {
      id: `mock-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
      userId: session.user.id,
      userEmail: session.user.email ?? null,
      userRole: String(session.user.role ?? "") || null,
      action,
      resource,
      resourceId: resourceId ?? null,
      result,
      details: details ?? {},
      ip,
      userAgent,
      createdAt: new Date().toISOString(),
    };
    const store = getMockAuditStore();
    store.unshift(entry);
    if (store.length > 500) {
      store.splice(500);
    }

    if (process.env.NODE_ENV === "development") {
      console.info("[audit-log][mock]", {
        userId: session.user.id,
        action,
        resource,
        resourceId,
        result,
      });
    }
    return;
  }

  try {
    const sql = getSqlClient();
    await sql`
      INSERT INTO audit_log (
        user_id,
        user_email,
        user_role,
        acao,
        recurso,
        recurso_id,
        resultado,
        detalhes,
        ip,
        user_agent
      )
      VALUES (
        ${session.user.id},
        ${session.user.email ?? null},
        ${String(session.user.role ?? "") || null},
        ${action},
        ${resource},
        ${resourceId ?? null},
        ${result},
        ${JSON.stringify(details ?? {})}::jsonb,
        ${ip},
        ${userAgent}
      )
    `;
  } catch (error) {
    console.warn("[audit-log] falha ao persistir evento", error);
  }
}

export async function listAuditLog(input?: {
  limit?: number;
  userId?: string;
  resource?: string;
}): Promise<AuditLogEntry[]> {
  const limit = Math.max(1, Math.min(200, input?.limit ?? 50));
  const userId = input?.userId?.trim();
  const resource = input?.resource?.trim();

  if (getDataMode() !== "real") {
    const store = getMockAuditStore();
    return store
      .filter((entry) => (userId ? entry.userId === userId : true))
      .filter((entry) => (resource ? entry.resource === resource : true))
      .slice(0, limit);
  }

  const sql = getSqlClient();
  const rows = await sql<{
    id: string;
    user_id: string;
    user_email: string | null;
    user_role: string | null;
    acao: AuditAction;
    recurso: string;
    recurso_id: string | null;
    resultado: "success" | "error" | "denied";
    detalhes: Record<string, unknown> | null;
    ip: string | null;
    user_agent: string | null;
    criado_em: string;
  }[]>`
    SELECT
      id::text,
      user_id,
      user_email,
      user_role,
      acao,
      recurso,
      recurso_id,
      resultado,
      detalhes,
      ip,
      user_agent,
      criado_em::text
    FROM audit_log
    WHERE (${userId ?? null}::text IS NULL OR user_id = ${userId ?? null})
      AND (${resource ?? null}::text IS NULL OR recurso = ${resource ?? null})
    ORDER BY criado_em DESC
    LIMIT ${limit}
  `;

  return rows.map((row) => ({
    id: row.id,
    userId: row.user_id,
    userEmail: row.user_email,
    userRole: row.user_role,
    action: row.acao,
    resource: row.recurso,
    resourceId: row.recurso_id,
    result: row.resultado,
    details: row.detalhes ?? {},
    ip: row.ip,
    userAgent: row.user_agent,
    createdAt: row.criado_em,
  }));
}
