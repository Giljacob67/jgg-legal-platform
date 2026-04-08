import { NextResponse } from "next/server";
import { vincularDocumento } from "@/modules/documentos/application/vincularDocumento";
import { requireSessionWithPermission } from "@/lib/api-auth";
import { apiError } from "@/lib/api-response";
import { writeAuditLog } from "@/lib/security/audit-log";

type VincularDocumentoRequestBody = {
  tipoEntidade: "caso" | "pedido_peca";
  entidadeId: string;
  papel?: "principal" | "apoio";
};

export async function POST(
  request: Request,
  context: { params: Promise<Record<string, string>> },
) {
  const authResult = await requireSessionWithPermission({ modulo: "documentos", acao: "write" });
  if (authResult.response) return authResult.response;

  try {
    const params = await context.params;
    const documentoId = params.documentoId;

    if (!documentoId) {
      return apiError("VALIDATION_ERROR", "documentoId é obrigatório.", 400);
    }

    const body = (await request.json()) as VincularDocumentoRequestBody;

    if (!body.entidadeId?.trim()) {
      return apiError("INVALID_LINKS_PAYLOAD", "entidadeId é obrigatório.", 400);
    }

    if (body.tipoEntidade !== "caso" && body.tipoEntidade !== "pedido_peca") {
      return apiError("INVALID_LINKS_PAYLOAD", "tipoEntidade inválido.", 400);
    }

    const vinculo = await vincularDocumento({
      documentoId,
      tipoEntidade: body.tipoEntidade,
      entidadeId: body.entidadeId,
      papel: body.papel,
    });

    await writeAuditLog({
      request,
      session: authResult.session,
      action: "update",
      resource: "documentos.vinculos",
      resourceId: documentoId,
      result: "success",
      details: { tipoEntidade: body.tipoEntidade, entidadeId: body.entidadeId },
    });

    return NextResponse.json({ vinculo });
  } catch (error) {
    return apiError("INTERNAL_ERROR", error instanceof Error ? error.message : "Falha ao vincular documento.", 500);
  }
}
