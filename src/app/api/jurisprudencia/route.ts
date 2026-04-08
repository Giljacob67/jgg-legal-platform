import { NextResponse } from "next/server";
import { listarJurisprudencias, pesquisarJurisprudencias, criarJurisprudencia } from "@/modules/jurisprudencia/application";
import type { TipoDecisao, Jurisprudencia } from "@/modules/jurisprudencia/domain/types";
import { requireSessionWithPermission } from "@/lib/api-auth";
import { apiError } from "@/lib/api-response";
import { writeAuditLog } from "@/lib/security/audit-log";

export async function GET(request: Request) {
  const authResult = await requireSessionWithPermission({ modulo: "jurisprudencia", acao: "read" });
  if (authResult.response) return authResult.response;

  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q");
    const tribunal = searchParams.get("tribunal") ?? undefined;
    const tipo = searchParams.get("tipo") as TipoDecisao | null;
    const materia = searchParams.get("materia") ?? undefined;

    const jurisprudencias = q
      ? await pesquisarJurisprudencias(q)
      : await listarJurisprudencias({ tribunal, tipo: tipo ?? undefined, materia });

    await writeAuditLog({
      request,
      session: authResult.session,
      action: "read",
      resource: "jurisprudencia",
      result: "success",
      details: { total: jurisprudencias.length, hasQuery: Boolean(q) },
    });

    return NextResponse.json({ jurisprudencias, total: jurisprudencias.length });
  } catch (error) {
    return apiError("INTERNAL_ERROR", error instanceof Error ? error.message : "Erro ao buscar jurisprudências.", 500);
  }
}

export async function POST(request: Request) {
  const authResult = await requireSessionWithPermission({ modulo: "jurisprudencia", acao: "write" });
  if (authResult.response) return authResult.response;

  try {
    const body = (await request.json()) as Omit<Jurisprudencia, "id" | "criadoEm">;
    if (!body.titulo || !body.ementa || !body.tribunal) {
      return apiError("VALIDATION_ERROR", "Campos obrigatórios: titulo, ementa e tribunal.", 400);
    }

    const jurisprudencia = await criarJurisprudencia(body);

    await writeAuditLog({
      request,
      session: authResult.session,
      action: "create",
      resource: "jurisprudencia",
      resourceId: jurisprudencia.id,
      result: "success",
    });

    return NextResponse.json({ jurisprudencia }, { status: 201 });
  } catch (error) {
    return apiError("INTERNAL_ERROR", error instanceof Error ? error.message : "Erro ao criar jurisprudência.", 500);
  }
}
