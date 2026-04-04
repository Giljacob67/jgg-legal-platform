import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

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
