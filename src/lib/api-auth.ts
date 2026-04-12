import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { resolverPerfilUsuario } from "@/modules/administracao/domain/types";
import type { ModuloPlataforma, NivelAcesso } from "@/modules/administracao/domain/types";

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

type NivelMinimo = NivelAcesso;

/**
 * Verifica se o usuário autenticado tem nível de acesso mínimo `nivelMinimo`
 * no módulo `modulo` antes de permitir a operação.
 *
 * Uso:
 *   const rbac = await requireRBAC("peticoes", "edicao");
 *   if (rbac) return rbac;
 */
export async function requireRBAC(
  modulo: ModuloPlataforma,
  nivelMinimo: NivelMinimo = "edicao",
): Promise<NextResponse | null> {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const perfil = resolverPerfilUsuario(session.user.role as string);

  // Importar aqui para evitar ciclo com módulos administrativos
  const { PERMISSOES_PADRAO } = await import("@/modules/administracao/domain/types");
  const nivel = PERMISSOES_PADRAO[perfil]?.[modulo];

  if (nivel === "sem_acesso") {
    return NextResponse.json(
      { error: `Sem permissão para acessar o módulo '${modulo}'.` },
      { status: 403 },
    );
  }

  const ordemNivel: Record<NivelAcesso, number> = { sem_acesso: 0, leitura: 1, edicao: 2, total: 3 };
  if ((ordemNivel[nivel] ?? 0) < (ordemNivel[nivelMinimo] ?? 0)) {
    return NextResponse.json(
      { error: `Permissão insuficiente para '${modulo}'. Necessário: ${nivelMinimo}.` },
      { status: 403 },
    );
  }

  return null;
}
