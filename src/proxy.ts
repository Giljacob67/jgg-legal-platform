import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import type { ModuloPlataforma, PerfilUsuario } from "@/modules/administracao/domain/types";
import { PERMISSOES_PADRAO, resolverPerfilUsuario } from "@/modules/administracao/domain/types";

/**
 * Mapeamento de prefixo de rota → ModuloPlataforma.
 * A ordem importa: rotas mais específicas primeiro.
 */
const ROTA_PARA_MODULO: Array<[string, ModuloPlataforma]> = [
  ["/administracao", "administracao"],
  ["/bi", "bi"],
  ["/gestao", "gestao"],
  ["/peticoes", "peticoes"],
  ["/casos", "casos"],
  ["/documentos", "documentos"],
  ["/biblioteca", "biblioteca_juridica"],
  ["/contratos", "contratos"],
  ["/jurisprudencia", "jurisprudencia"],
  ["/clientes", "clientes"],
  ["/dashboard", "dashboard"],
];

function resolverModulo(pathname: string): ModuloPlataforma | null {
  for (const [prefixo, modulo] of ROTA_PARA_MODULO) {
    if (pathname === prefixo || pathname.startsWith(`${prefixo}/`)) {
      return modulo;
    }
  }
  return null;
}

function temAcesso(perfil: PerfilUsuario, modulo: ModuloPlataforma): boolean {
  const nivel = PERMISSOES_PADRAO[perfil]?.[modulo];
  return nivel !== "sem_acesso" && nivel !== undefined;
}

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  // Rotas públicas — nunca bloquear
  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/sem-permissao") ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  // Usuário não autenticado → redirecionar para login
  if (!session?.user) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Verificar RBAC para rotas do hub
  const modulo = resolverModulo(pathname);
  if (modulo) {
    const perfil = resolverPerfilUsuario(session.user.role as string);
    if (!temAcesso(perfil, modulo)) {
      const semPermissaoUrl = new URL("/sem-permissao", req.url);
      semPermissaoUrl.searchParams.set("modulo", modulo);
      semPermissaoUrl.searchParams.set("de", pathname);
      return NextResponse.redirect(semPermissaoUrl);
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
};
