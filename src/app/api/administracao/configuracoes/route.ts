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

    const body = (await request.json()) as {
      chave?: string;
      valor?: string;
      updates?: Array<{ chave: string; valor: string }>;
    };

    const updates =
      Array.isArray(body.updates) && body.updates.length > 0
        ? body.updates
        : body.chave
          ? [{ chave: body.chave, valor: body.valor ?? "" }]
          : [];

    if (updates.length === 0) {
      return NextResponse.json({ error: "Informe 'chave/valor' ou 'updates'." }, { status: 400 });
    }

    for (const update of updates) {
      if (!update.chave || typeof update.valor === "undefined") {
        return NextResponse.json({ error: "Cada update precisa de chave e valor." }, { status: 400 });
      }
      const valorSanitizado = String(update.valor).trim();
      await atualizarConfiguracao(update.chave, valorSanitizado);
    }

    const updateMap = new Map(updates.map((item) => [item.chave, String(item.valor).trim()]));
    if (updateMap.has("ai_provider")) {
      process.env.AI_PROVIDER = updateMap.get("ai_provider") ?? "";
    }
    if (updateMap.has("ai_model")) {
      process.env.AI_MODEL = updateMap.get("ai_model") ?? "";
    }

    await syncRuntimeAIConfig({ force: true });
    return NextResponse.json({
      ok: true,
      updated: updates.map((item) => ({ chave: item.chave, valor: String(item.valor).trim() })),
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erro." }, { status: 500 });
  }
}
