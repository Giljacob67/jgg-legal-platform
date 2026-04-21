import { NextResponse } from "next/server";
import { obterConfiguracoes, atualizarConfiguracao } from "@/modules/administracao/application";
import { requireRBAC } from "@/lib/api-auth";
import { auth } from "@/lib/auth";
import { resolverPerfilUsuario } from "@/modules/administracao/domain/types";
import { syncRuntimeAIConfig } from "@/lib/ai/runtime-config";

const PERFIS_PODEM_EDITAR = new Set(["administrador_sistema", "socio_direcao"]);

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
  // Alteracao de configuracoes: socio da direcao e administrador do sistema
  const forbidden = await requireRBAC("administracao", "leitura");
  if (forbidden) return forbidden;

  try {
    const session = await auth();
    const perfil = resolverPerfilUsuario(session?.user.role as string | undefined);
    if (!PERFIS_PODEM_EDITAR.has(perfil)) {
      return NextResponse.json(
        { error: "Apenas sócio da direção ou administrador do sistema podem editar configurações." },
        { status: 403 },
      );
    }

    const body = (await request.json()) as { chave: string; valor: string };
    if (!body.chave || body.valor === undefined) {
      return NextResponse.json({ error: "chave e valor são obrigatórios." }, { status: 400 });
    }

    const valorSanitizado = String(body.valor).trim();
    await atualizarConfiguracao(body.chave, valorSanitizado);

    if (body.chave === "ai_provider") {
      process.env.AI_PROVIDER = valorSanitizado;
    }
    if (body.chave === "ai_model") {
      process.env.AI_MODEL = valorSanitizado;
    }

    await syncRuntimeAIConfig({ force: true });
    return NextResponse.json({ ok: true, chave: body.chave, valor: valorSanitizado });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erro." }, { status: 500 });
  }
}
