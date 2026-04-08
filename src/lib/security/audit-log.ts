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
