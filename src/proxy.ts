export { auth as proxy } from "@/lib/auth";

export const config = {
  matcher: [
    "/((?!api/auth|login|acesso-negado|_next/static|_next/image|favicon.ico).*)",
  ],
};
