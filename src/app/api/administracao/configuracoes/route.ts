import { NextResponse } from "next/server";
import { obterConfiguracoes, atualizarConfiguracao } from "@/modules/administracao/application";
import { requireRBAC } from "@/lib/api-auth";

export async function GET() {
  // Leitura de configurações: administrador e sócios
  const forbidden = await requireRBAC("administracao", "leitura");
  if (forbidden) return forbidden;

  try {
    const configuracoes = await obterConfiguracoes();
    return NextResponse.json({ configuracoes });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erro ao obter configurações." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  // Alteração de configurações: apenas administrador do sistema
  const forbidden = await requireRBAC("administracao", "total");
  if (forbidden) return forbidden;

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
