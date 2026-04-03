import { NextResponse } from "next/server";
import { atualizarPerfilUsuario, ativarDesativarUsuario } from "@/modules/administracao/application";
import type { PerfilUsuario } from "@/modules/administracao/domain/types";

type Params = { params: Promise<{ userId: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const { userId } = await params;
  try {
    const body = (await request.json()) as { perfil?: PerfilUsuario; ativo?: boolean };

    if (body.perfil !== undefined) {
      const usuario = await atualizarPerfilUsuario(userId, body.perfil);
      return NextResponse.json({ usuario });
    }

    if (body.ativo !== undefined) {
      const usuario = await ativarDesativarUsuario(userId, body.ativo);
      return NextResponse.json({ usuario });
    }

    return NextResponse.json({ error: "Forneça 'perfil' ou 'ativo'." }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erro ao atualizar usuário." }, { status: 500 });
  }
}
