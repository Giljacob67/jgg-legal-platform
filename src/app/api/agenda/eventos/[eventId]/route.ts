import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import {
  atualizarCompromissoAgendaGoogle,
  excluirCompromissoAgendaGoogle,
} from "@/modules/agenda/application/google-calendar";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const { eventId } = await params;
  const body = (await request.json()) as {
    titulo?: string;
    descricao?: string;
    inicio?: string;
    fim?: string;
    diaInteiro?: boolean;
    local?: string;
    calendarioId?: string;
    vinculoTipo?: "caso" | "pedido" | "cliente";
    vinculoId?: string;
    vinculoLabel?: string;
  };

  if (!body.titulo?.trim()) {
    return NextResponse.json({ error: "Informe o título do compromisso." }, { status: 400 });
  }

  if (!body.inicio) {
    return NextResponse.json({ error: "Informe a data/hora inicial." }, { status: 400 });
  }

  const evento = await atualizarCompromissoAgendaGoogle(session.user.id, eventId, {
    titulo: body.titulo.trim(),
    descricao: body.descricao?.trim(),
    inicio: body.inicio,
    fim: body.fim,
    diaInteiro: Boolean(body.diaInteiro),
    local: body.local?.trim(),
    calendarioId: body.calendarioId,
    vinculoTipo: body.vinculoTipo,
    vinculoId: body.vinculoId,
    vinculoLabel: body.vinculoLabel,
  });

  return NextResponse.json({ ok: true, evento });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const { eventId } = await params;
  const { searchParams } = new URL(request.url);
  const calendarioId = searchParams.get("calendarId") || undefined;

  await excluirCompromissoAgendaGoogle(session.user.id, eventId, calendarioId);
  return NextResponse.json({ ok: true });
}
