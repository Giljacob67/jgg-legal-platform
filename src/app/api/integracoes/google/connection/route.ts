import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  definirCalendarioAgendaGoogle,
  desconectarGoogleAgenda,
  obterStatusAgendaGoogle,
} from "@/modules/agenda/application/google-calendar";

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

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const body = (await request.json()) as { selectedCalendarId?: string };
  if (!body.selectedCalendarId) {
    return NextResponse.json({ error: "Informe o calendário a ser ativado." }, { status: 400 });
  }

  await definirCalendarioAgendaGoogle(session.user.id, body.selectedCalendarId);
  return NextResponse.json({ ok: true, selectedCalendarId: body.selectedCalendarId });
}
