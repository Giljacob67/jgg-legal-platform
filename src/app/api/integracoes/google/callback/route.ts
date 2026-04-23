import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { concluirConexaoGoogleAgenda } from "@/modules/agenda/application/google-calendar";
import { validarOAuthState } from "@/modules/agenda/infrastructure/oauth-state.server";

export async function GET(request: Request) {
  const session = await auth();
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (!session?.user?.id) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (error) {
    return NextResponse.redirect(new URL(`/agenda?google=erro&detalhe=${encodeURIComponent(error)}`, request.url));
  }

  if (!code || !state) {
    return NextResponse.redirect(new URL("/agenda?google=erro&detalhe=callback_incompleto", request.url));
  }

  const payload = validarOAuthState(state);
  if (!payload || payload.userId !== session.user.id) {
    return NextResponse.redirect(new URL("/agenda?google=erro&detalhe=state_invalido", request.url));
  }

  try {
    await concluirConexaoGoogleAgenda(session.user.id, code);
    return NextResponse.redirect(new URL(`${payload.redirectTo}?google=conectado`, request.url));
  } catch (callbackError) {
    const detalhe = callbackError instanceof Error ? callbackError.message : "falha_oauth";
    return NextResponse.redirect(new URL(`/agenda?google=erro&detalhe=${encodeURIComponent(detalhe)}`, request.url));
  }
}
