import { NextResponse } from "next/server";
import { listarUsuarios, convidarUsuario } from "@/modules/administracao/application";
import type { ConviteUsuario } from "@/modules/administracao/domain/types";
import { requireRole } from "@/lib/api-auth";
import { enviarEmailConvite } from "@/lib/email/convite";

// Apenas administrador e sócio podem gerenciar usuários
const ROLES_GESTAO_USUARIOS = ["administrador_sistema", "socio_direcao"] as const;

export async function GET() {
  const forbidden = await requireRole([...ROLES_GESTAO_USUARIOS]);
  if (forbidden) return forbidden;

  const usuarios = await listarUsuarios();
  return NextResponse.json({ usuarios });
}

export async function POST(request: Request) {
  const forbidden = await requireRole([...ROLES_GESTAO_USUARIOS]);
  if (forbidden) return forbidden;

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
