import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { resolverPerfilUsuario, type PerfilUsuario } from "@/modules/administracao/domain/types";

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
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
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
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }
  return null;
}

/**
 * Inline auth + role check. Returns 401 if unauthenticated, 403 if unauthorized role.
 *
 * Usage:
 *   const forbidden = await requireRole(["administrador_sistema", "socio_direcao"]);
 *   if (forbidden) return forbidden;
 */
export async function requireRole(
  allowedRoles: PerfilUsuario[],
): Promise<NextResponse | null> {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const perfil = resolverPerfilUsuario(session.user.role as string | undefined);

  if (!allowedRoles.includes(perfil)) {
    return NextResponse.json(
      { error: "Acesso negado. Perfil sem permissão para esta operação." },
      { status: 403 },
    );
  }

  return null;
}

/**
 * Returns the resolved PerfilUsuario from the current session, or null if unauthenticated.
 * Useful when you need the session role inside a route handler.
 */
export async function getSessionPerfil(): Promise<{
  userId: string;
  perfil: PerfilUsuario;
} | null> {
  const session = await auth();
  if (!session?.user) return null;
  return {
    userId: session.user.id,
    perfil: resolverPerfilUsuario(session.user.role as string | undefined),
  };
}
