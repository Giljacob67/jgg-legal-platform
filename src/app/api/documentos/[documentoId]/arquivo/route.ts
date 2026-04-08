import { NextResponse } from "next/server";
import { getDocumentosInfra } from "@/modules/documentos/infrastructure/provider.server";
import { requireSessionWithPermission } from "@/lib/api-auth";
import { apiError } from "@/lib/api-response";
import { writeAuditLog } from "@/lib/security/audit-log";

export async function GET(
  request: Request,
  context: { params: Promise<Record<string, string>> },
) {
  const authResult = await requireSessionWithPermission({ modulo: "documentos", acao: "read" });
  if (authResult.response) return authResult.response;

  try {
    const params = await context.params;
    const documentoId = params.documentoId;

    if (!documentoId) {
      return apiError("VALIDATION_ERROR", "documentoId é obrigatório.", 400);
    }

    const infra = getDocumentosInfra();
    const documento = await infra.documentoJuridicoRepository.obterPorId(documentoId);
    if (!documento) {
      return apiError("NOT_FOUND", "Documento não encontrado.", 404);
    }

    const arquivo = await infra.arquivoFisicoRepository.obterPorId(documento.arquivoFisicoId);
    if (!arquivo) {
      return apiError("NOT_FOUND", "Arquivo físico não encontrado.", 404);
    }

    const leitura = await infra.fileStorageGateway.get({ providerKey: arquivo.providerKey });
    if (!leitura) {
      return apiError("NOT_FOUND", "Leitura de arquivo não disponível para este provider.", 404);
    }

    await writeAuditLog({
      request,
      session: authResult.session,
      action: "download",
      resource: "documentos",
      resourceId: documentoId,
      result: "success",
    });

    return NextResponse.redirect(new URL(leitura.downloadUrl), { status: 307 });
  } catch (error) {
    return apiError("INTERNAL_ERROR", error instanceof Error ? error.message : "Falha ao recuperar arquivo.", 500);
  }
}
