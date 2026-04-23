import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { iniciarConexaoGoogleAgenda } from "@/modules/agenda/application/google-calendar";
import { criarOAuthState } from "@/modules/agenda/infrastructure/oauth-state.server";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const { searchParams } = new URL(request.url);
  const redirectTo = searchParams.get("redirectTo") || "/agenda";
  const state = criarOAuthState({
    userId: session.user.id,
    redirectTo,
  });

  const url = await iniciarConexaoGoogleAgenda(state);
  return NextResponse.redirect(url);
}
