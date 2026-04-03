import { NextResponse } from "next/server";
import { listarUsuarios, convidarUsuario } from "@/modules/administracao/application";
import type { ConviteUsuario } from "@/modules/administracao/domain/types";

export async function GET() {
  const usuarios = await listarUsuarios();
  return NextResponse.json({ usuarios });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ConviteUsuario;
    if (!body.nome || !body.email || !body.perfil) {
      return NextResponse.json({ error: "nome, email e perfil são obrigatórios." }, { status: 400 });
    }
    const usuario = await convidarUsuario(body);
    return NextResponse.json({ usuario }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erro ao convidar usuário." }, { status: 500 });
  }
}
