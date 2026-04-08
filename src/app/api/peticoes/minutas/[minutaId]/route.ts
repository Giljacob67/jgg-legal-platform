import { NextRequest, NextResponse } from "next/server";
import { requireSessionWithPermission } from "@/lib/api-auth";
import { apiError } from "@/lib/api-response";
import { getDb } from "@/lib/database/client";
import { minutas as minutasTable, versoesMinuta } from "@/lib/database/schema";
import { eq } from "drizzle-orm";
import { writeAuditLog } from "@/lib/security/audit-log";

type RouteContext = { params: Promise<{ minutaId: string }> };

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const authResult = await requireSessionWithPermission({ modulo: "peticoes", acao: "write" });
  if (authResult.response) return authResult.response;
  const { session } = authResult;

  const { minutaId } = await params;

  let conteudo: string;
  let resumo: string | undefined;
  try {
    const body = (await req.json()) as { conteudo: string; resumo?: string };
    if (!body.conteudo || typeof body.conteudo !== "string") {
      return apiError("VALIDATION_ERROR", "Campo 'conteudo' é obrigatório.", 400);
    }
    conteudo = body.conteudo;
    resumo = body.resumo;
  } catch {
    return apiError("VALIDATION_ERROR", "Corpo da requisição inválido.", 400);
  }

  try {
    const db = getDb();

    // Verificar se a minuta existe
    const rows = await db.select().from(minutasTable).where(eq(minutasTable.id, minutaId));
    if (rows.length === 0) {
      return apiError("NOT_FOUND", "Minuta não encontrada.", 404);
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

    await writeAuditLog({
      request: req,
      session,
      action: "update",
      resource: "peticoes.minutas",
      resourceId: minutaId,
      result: "success",
      details: { versaoId, numero: proximoNumero },
    });

    return NextResponse.json({
      ok: true,
      versaoId,
      numero: proximoNumero,
      savedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[api/peticoes/minutas/PATCH] Erro ao salvar minuta:", error);
    return apiError("INTERNAL_ERROR", error instanceof Error ? error.message : "Erro ao salvar minuta.", 500);
  }
}
