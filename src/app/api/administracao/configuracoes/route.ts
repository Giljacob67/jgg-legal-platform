import { NextResponse } from "next/server";
import { obterConfiguracoes, atualizarConfiguracao } from "@/modules/administracao/application";
import { requireAuth } from "@/lib/api-auth";

export async function GET() {
  const unauth = await requireAuth();
  if (unauth) return unauth;

  try {
    const configuracoes = await obterConfiguracoes();
    return NextResponse.json({ configuracoes });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erro ao obter configurações." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const unauth = await requireAuth();
  if (unauth) return unauth;

  try {
    const body = (await request.json()) as { chave: string; valor: string };
    if (!body.chave || body.valor === undefined) {
      return NextResponse.json({ error: "chave e valor são obrigatórios." }, { status: 400 });
    }
    await atualizarConfiguracao(body.chave, body.valor);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erro." }, { status: 500 });
  }
}
