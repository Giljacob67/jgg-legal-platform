import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { requireRBAC } from "@/lib/api-auth";
import { getDb } from "@/lib/database/client";
import { minutas as minutasTable, versoesMinuta } from "@/lib/database/schema";
import { eq } from "drizzle-orm";
import { obterPedidoDePeca } from "@/modules/peticoes/application/obterPedidoDePeca";

type RouteContext = { params: Promise<{ minutaId: string }> };

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const forbidden = await requireRBAC("peticoes", "edicao");
  if (forbidden) return forbidden;

  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const { minutaId } = await params;

  let conteudo: string;
  let resumo: string | undefined;
  try {
    const body = (await req.json()) as { conteudo: string; resumo?: string };
    if (!body.conteudo || typeof body.conteudo !== "string") {
      return NextResponse.json({ error: "Campo 'conteudo' é obrigatório." }, { status: 400 });
    }
    conteudo = body.conteudo;
    resumo = body.resumo;
  } catch {
    return NextResponse.json({ error: "Corpo da requisição inválido." }, { status: 400 });
  }

  try {
    const db = getDb();

    // Verificar se a minuta existe
    const rows = await db.select().from(minutasTable).where(eq(minutasTable.id, minutaId));
    if (rows.length === 0) {
      return NextResponse.json({ error: "Minuta não encontrada." }, { status: 404 });
    }

    const pedidoId = rows[0].pedidoId ?? "";
    if (!pedidoId) {
      return NextResponse.json({ error: "Minuta sem pedido vinculado." }, { status: 422 });
    }

    const pedido = await obterPedidoDePeca(pedidoId);
    if (!pedido) {
      return NextResponse.json({ error: "Pedido da minuta não encontrado." }, { status: 404 });
    }

    // Atualizar conteúdo atual
    await db
      .update(minutasTable)
      .set({ conteudoAtual: conteudo })
      .where(eq(minutasTable.id, minutaId));

    // Obter número da próxima versão
    const versoes = await db
      .select()
      .from(versoesMinuta)
      .where(eq(versoesMinuta.minutaId, minutaId));
    const proximoNumero = versoes.length + 1;

    // Gerar ID de versão
    const versaoId = `VER-${minutaId}-${proximoNumero.toString().padStart(3, "0")}`;
    const autor = session.user?.name ?? session.user?.email ?? "Usuário";

    // Inserir nova versão
    await db.insert(versoesMinuta).values({
      id: versaoId,
      minutaId,
      numero: proximoNumero,
      autor,
      resumoMudancas: resumo ?? "Rascunho salvo manualmente.",
      conteudo,
    });

    return NextResponse.json({
      ok: true,
      versaoId,
      numero: proximoNumero,
      savedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[api/peticoes/minutas/PATCH] Erro ao salvar minuta:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao salvar minuta." },
      { status: 500 },
    );
  }
}
