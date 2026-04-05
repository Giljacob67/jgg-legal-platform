import { NextResponse } from "next/server";
import { listarUsuarios, convidarUsuario } from "@/modules/administracao/application";
import type { ConviteUsuario } from "@/modules/administracao/domain/types";
import { requireAuth } from "@/lib/api-auth";
import { enviarEmailConvite } from "@/lib/email/convite";

export async function GET() {
  const unauth = await requireAuth();
  if (unauth) return unauth;

  const usuarios = await listarUsuarios();
  return NextResponse.json({ usuarios });
}

export async function POST(request: Request) {
  const unauth = await requireAuth();
  if (unauth) return unauth;

  try {
    const body = (await request.json()) as ConviteUsuario;
    if (!body.nome || !body.email || !body.perfil) {
      return NextResponse.json({ error: "nome, email e perfil são obrigatórios." }, { status: 400 });
    }
    const usuario = await convidarUsuario(body);
    const resultadoEmail = await enviarEmailConvite(body.nome, body.email, body.perfil);
    return NextResponse.json({ usuario, email: resultadoEmail }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erro ao convidar usuário." }, { status: 500 });
  }
}
