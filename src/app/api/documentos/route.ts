import { NextResponse } from "next/server";
import { listarDocumentosComDetalhes } from "@/modules/documentos/application/listarDocumentos";
import { requireSessionWithPermission } from "@/lib/api-auth";
import { apiError } from "@/lib/api-response";
import { writeAuditLog } from "@/lib/security/audit-log";

export async function GET(request: Request) {
  const authResult = await requireSessionWithPermission({ modulo: "documentos", acao: "read" });
  if (authResult.response) return authResult.response;

  try {
    const { searchParams } = new URL(request.url);

    const casoId = searchParams.get("casoId") ?? undefined;
    const pedidoId = searchParams.get("pedidoId") ?? undefined;

    const documentos = await listarDocumentosComDetalhes({ casoId, pedidoId });
    const documentosResponse = documentos.map((item) => ({
      ...item,
      arquivo: {
        ...item.arquivo,
        url: `/api/documentos/${item.documento.id}/arquivo`,
      },
    }));

    await writeAuditLog({
      request,
      session: authResult.session,
      action: "read",
      resource: "documentos",
      result: "success",
      details: { total: documentosResponse.length, casoId, pedidoId },
    });

    return NextResponse.json({ documentos: documentosResponse });
  } catch (error) {
    return apiError("INTERNAL_ERROR", error instanceof Error ? error.message : "Falha ao listar documentos.", 500);
  }
}
