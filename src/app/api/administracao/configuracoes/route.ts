import { NextResponse } from "next/server";
import { obterConfiguracoes, atualizarConfiguracao } from "@/modules/administracao/application";

export async function GET() {
  const configuracoes = await obterConfiguracoes();
  return NextResponse.json({ configuracoes });
}

export async function PATCH(request: Request) {
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
