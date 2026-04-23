import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { desconectarGoogleAgenda, obterStatusAgendaGoogle } from "@/modules/agenda/application/google-calendar";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const status = await obterStatusAgendaGoogle(session.user.id);
  return NextResponse.json(status);
}

export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  await desconectarGoogleAgenda(session.user.id);
  return NextResponse.json({ ok: true });
}
