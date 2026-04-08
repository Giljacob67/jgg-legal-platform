import { NextResponse } from "next/server";
import { getBibliotecaRepo } from "@/modules/biblioteca-conhecimento/infrastructure/mockBibliotecaRepository";
import type { TipoDocumentoBC, StatusEmbedding } from "@/modules/biblioteca-conhecimento/domain/types";
import { requireSessionWithPermission } from "@/lib/api-auth";
import { apiError } from "@/lib/api-response";
import { writeAuditLog } from "@/lib/security/audit-log";

export async function GET(request: Request) {
  const authResult = await requireSessionWithPermission({ modulo: "biblioteca_juridica", acao: "read" });
  if (authResult.response) return authResult.response;

  const { searchParams } = new URL(request.url);
  const tipo = searchParams.get("tipo") as TipoDocumentoBC | null;
  const fonte = searchParams.get("fonte") ?? undefined;
  const status = searchParams.get("status") ?? undefined;

  const repo = getBibliotecaRepo();
  const [documentos, stats] = await Promise.all([
    repo.listar({ tipo: tipo ?? undefined, fonte, status: status as StatusEmbedding | undefined }),
    repo.contar(),
  ]);

  await writeAuditLog({
    request,
    session: authResult.session,
    action: "read",
    resource: "biblioteca",
    result: "success",
    details: { total: documentos.length },
  });

  return NextResponse.json({ documentos, stats });
}

export async function DELETE(request: Request) {
  const authResult = await requireSessionWithPermission({ modulo: "biblioteca_juridica", acao: "delete" });
  if (authResult.response) return authResult.response;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return apiError("VALIDATION_ERROR", "Parâmetro obrigatório: id.", 400);
  }

  const repo = getBibliotecaRepo();
  await repo.remover(id);

  await writeAuditLog({
    request,
    session: authResult.session,
    action: "delete",
    resource: "biblioteca",
    resourceId: id,
    result: "success",
  });

  return NextResponse.json({ ok: true });
}
