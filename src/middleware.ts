import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Rotas públicas que não exigem autenticação.
 * Tudo mais dentro do grupo (hub) requer sessão válida.
 */
const PUBLIC_PATHS = [
  "/login",
  "/acesso-negado",
  "/api/auth",       // NextAuth handlers
];

export default auth((req: NextRequest & { auth: unknown }) => {
  const { pathname } = req.nextUrl;

  // Permitir rotas públicas sem verificação
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Permitir arquivos estáticos e internos do Next.js
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Se não há sessão, redirecionar para login
  if (!req.auth) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  // Executar o middleware em todas as rotas exceto assets estáticos
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
