import { NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import type { TipoDocumento } from "@/modules/documentos/domain/types";
import { requireSessionWithPermission } from "@/lib/api-auth";
import { apiError } from "@/lib/api-response";
import { registrarUploadClienteDocumento } from "@/modules/documentos/application/registrarUploadClienteDocumento";
import { validarTipoDocumento } from "@/modules/documentos/application/validation";
import { writeAuditLog } from "@/lib/security/audit-log";

const MIME_TYPES_PERMITIDOS = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
];
const MAX_UPLOAD_BYTES = Number(process.env.UPLOAD_MAX_BYTES ?? 25 * 1024 * 1024);

type UploadClientPayload = {
  filename: string;
  sizeBytes: number;
  titulo: string;
  tipoDocumento: TipoDocumento;
  vinculos: Array<{
    tipoEntidade: "caso" | "pedido_peca";
    entidadeId: string;
    papel?: "principal" | "apoio";
  }>;
};

function parseTokenPayload(raw: string | null | undefined): UploadClientPayload {
  if (!raw) {
    throw new Error("Payload de upload ausente.");
  }

  const parsed = JSON.parse(raw) as UploadClientPayload;
  if (!parsed.filename?.trim() || !parsed.titulo?.trim() || !Number.isFinite(parsed.sizeBytes)) {
    throw new Error("Payload de upload inválido.");
  }

  validarTipoDocumento(parsed.tipoDocumento);

  const vinculos = (parsed.vinculos ?? []).filter(
    (item) =>
      (item.tipoEntidade === "caso" || item.tipoEntidade === "pedido_peca") &&
      typeof item.entidadeId === "string" &&
      item.entidadeId.trim().length > 0,
  );

  if (vinculos.length === 0) {
    throw new Error("Payload de upload sem vínculos válidos.");
  }

  return {
    ...parsed,
    filename: parsed.filename.trim(),
    sizeBytes: parsed.sizeBytes,
    titulo: parsed.titulo.trim(),
    vinculos,
  };
}

export async function POST(request: Request) {
  const authResult = await requireSessionWithPermission({ modulo: "documentos", acao: "write" });
  if (authResult.response) return authResult.response;

  try {
    const body = (await request.json()) as HandleUploadBody;

    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (_pathname, clientPayload) => {
        parseTokenPayload(clientPayload);

        return {
          allowedContentTypes: MIME_TYPES_PERMITIDOS,
          maximumSizeInBytes: MAX_UPLOAD_BYTES,
          addRandomSuffix: true,
          tokenPayload: clientPayload,
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        const payload = parseTokenPayload(tokenPayload);

        await registrarUploadClienteDocumento({
          filename: payload.filename,
          sizeBytes: payload.sizeBytes,
          titulo: payload.titulo,
          tipoDocumento: payload.tipoDocumento,
          vinculos: payload.vinculos,
          blob: {
            pathname: blob.pathname,
            url: blob.url,
            contentType: blob.contentType,
          },
        });
      },
    });

    await writeAuditLog({
      request,
      session: authResult.session,
      action: "upload",
      resource: "documentos.client-upload",
      result: "success",
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return apiError(
      "VALIDATION_ERROR",
      error instanceof Error ? error.message : "Falha no upload cliente de documento.",
      400,
    );
  }
}
