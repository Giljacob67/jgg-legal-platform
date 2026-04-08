import { NextResponse } from "next/server";
import { requireSessionWithPermission } from "@/lib/api-auth";
import { apiError } from "@/lib/api-response";
import { listarCasos } from "@/modules/casos/application/listarCasos";
import { criarCaso } from "@/modules/casos/application/criarCaso";
import type { NovoCasoPayload } from "@/modules/casos/infrastructure/mockCasosRepository";
import { writeAuditLog } from "@/lib/security/audit-log";

export async function GET(request: Request) {
  const authResult = await requireSessionWithPermission({ modulo: "casos", acao: "read" });
  if (authResult.response) return authResult.response;

  try {
    const casosList = await listarCasos();
    await writeAuditLog({
      request,
      session: authResult.session,
      action: "read",
      resource: "casos",
      result: "success",
      details: { total: casosList.length },
    });
    return NextResponse.json({ casos: casosList });
  } catch (error) {
    return apiError("INTERNAL_ERROR", error instanceof Error ? error.message : "Erro ao listar casos.", 500);
  }
}

export async function POST(request: Request) {
  const authResult = await requireSessionWithPermission({ modulo: "casos", acao: "write" });
  if (authResult.response) return authResult.response;

  try {
    const body = (await request.json()) as NovoCasoPayload;
    if (!body.titulo || !body.cliente || !body.materia) {
      return apiError("VALIDATION_ERROR", "Campos obrigatórios: titulo, cliente, materia.", 400);
    }
    const caso = await criarCaso(body);
    await writeAuditLog({
      request,
      session: authResult.session,
      action: "create",
      resource: "casos",
      resourceId: caso.id,
      result: "success",
    });
    return NextResponse.json({ caso }, { status: 201 });
  } catch (error) {
    return apiError("INTERNAL_ERROR", error instanceof Error ? error.message : "Erro ao criar caso.", 500);
  }
}
