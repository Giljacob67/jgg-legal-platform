import "server-only";
import { NextRequest, NextResponse } from "next/server";
import type { Session } from "next-auth";
import { auth } from "@/lib/auth";
import { apiError } from "@/lib/api-response";
import { requirePermission, type PermissaoAcao } from "@/lib/authz";
import type { ModuloPlataforma } from "@/modules/administracao/domain/types";

type RouteHandler = (
  req: NextRequest,
  ctx: { params: Promise<Record<string, string>> },
) => Promise<NextResponse | Response>;

/**
 * Wraps a route handler with authentication check.
 * Returns 401 if the user is not authenticated.
 */
export function withAuth(handler: RouteHandler): RouteHandler {
  return async (req, ctx) => {
    const session = await auth();
    if (!session) {
      return apiError("UNAUTHORIZED", "Não autorizado.", 401);
    }
    return handler(req, ctx);
  };
}

/**
 * Inline auth check for route handlers with varied signatures.
 * Returns a 401 NextResponse if unauthenticated, otherwise null.
 *
 * Usage:
 *   const unauth = await requireAuth();
 *   if (unauth) return unauth;
 */
export async function requireAuth(): Promise<NextResponse | null> {
  const session = await auth();
  if (!session) {
    return apiError("UNAUTHORIZED", "Não autorizado.", 401);
  }
  return null;
}

export async function requireSession(): Promise<
  | { session: Session; response: null }
  | { session: null; response: NextResponse }
> {
  const session = (await auth()) as Session | null;
  if (!session) {
    return {
      session: null,
      response: apiError("UNAUTHORIZED", "Não autorizado.", 401),
    };
  }

  return {
    session,
    response: null,
  };
}

export async function requireSessionWithPermission(input: {
  modulo: ModuloPlataforma;
  acao: PermissaoAcao;
}): Promise<
  | { session: Session; response: null }
  | { session: null; response: NextResponse }
> {
  const authResult = await requireSession();
  if (authResult.response) {
    return authResult;
  }

  const forbidden = requirePermission({
    session: authResult.session,
    modulo: input.modulo,
    acao: input.acao,
  });
  if (forbidden) {
    return { session: null, response: forbidden };
  }

  return authResult;
}
