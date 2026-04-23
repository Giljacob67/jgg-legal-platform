import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { criarCompromissoAgendaGoogle } from "@/modules/agenda/application/google-calendar";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const body = (await request.json()) as {
    titulo?: string;
    descricao?: string;
    inicio?: string;
    fim?: string;
    diaInteiro?: boolean;
    local?: string;
    calendarioId?: string;
  };

  if (!body.titulo?.trim()) {
    return NextResponse.json({ error: "Informe o título do compromisso." }, { status: 400 });
  }

  if (!body.inicio) {
    return NextResponse.json({ error: "Informe a data/hora inicial." }, { status: 400 });
  }

  const evento = await criarCompromissoAgendaGoogle(session.user.id, {
    titulo: body.titulo.trim(),
    descricao: body.descricao?.trim(),
    inicio: body.inicio,
    fim: body.fim,
    diaInteiro: Boolean(body.diaInteiro),
    local: body.local?.trim(),
    calendarioId: body.calendarioId,
  });

  return NextResponse.json({ ok: true, evento });
}
