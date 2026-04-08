import { NextResponse } from "next/server";
import { fileTypeFromBuffer } from "file-type";
import type { TipoDocumento } from "@/modules/documentos/domain/types";
import { uploadDocumento } from "@/modules/documentos/application/uploadDocumento";
import { requireSessionWithPermission } from "@/lib/api-auth";
import { apiError } from "@/lib/api-response";
import { writeAuditLog } from "@/lib/security/audit-log";

type VinculoInput = {
  tipoEntidade: "caso" | "pedido_peca";
  entidadeId: string;
  papel?: "principal" | "apoio";
};

function parseVinculos(raw: string | null):
  | { ok: true; value: VinculoInput[] }
  | { ok: false; message: string } {
  if (!raw || raw.trim().length === 0) {
    return { ok: true, value: [] };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, message: "Campo vinculos inválido: JSON malformado." };
  }

  if (!Array.isArray(parsed)) {
    return { ok: false, message: "Campo vinculos deve ser uma lista." };
  }

  const vinculos: VinculoInput[] = [];
  for (const item of parsed) {
    if (typeof item !== "object" || item === null) {
      return { ok: false, message: "Campo vinculos contém item inválido." };
    }

    const { tipoEntidade, entidadeId, papel } = item as {
      tipoEntidade?: string;
      entidadeId?: string;
      papel?: string;
    };

    const tipoValido = tipoEntidade === "caso" || tipoEntidade === "pedido_peca";
    const entidadeValida = typeof entidadeId === "string" && entidadeId.trim().length > 0;
    const papelValido = !papel || papel === "principal" || papel === "apoio";

    if (!tipoValido || !entidadeValida || !papelValido) {
      return { ok: false, message: "Campo vinculos contém valores inválidos." };
    }

    vinculos.push({
      tipoEntidade,
      entidadeId: entidadeId.trim(),
      papel: papel as "principal" | "apoio" | undefined,
    });
  }

  return { ok: true, value: vinculos };
}

const MAX_UPLOAD_BYTES = Number(process.env.UPLOAD_MAX_BYTES ?? 25 * 1024 * 1024);
const MIME_ALLOWED = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
]);

class UploadValidationError extends Error {
  constructor(
    public readonly code: "UNSUPPORTED_FILE_TYPE" | "FILE_TOO_LARGE",
    message: string,
    public readonly status: number,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
  }
}

function inferMimeFromFilename(filename: string): string | null {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".pdf")) return "application/pdf";
  if (lower.endsWith(".doc")) return "application/msword";
  if (lower.endsWith(".docx")) return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  if (lower.endsWith(".txt")) return "text/plain";
  return null;
}

async function resolveTrustedMime(input: { filename: string; browserMime: string; buffer: Buffer }): Promise<string> {
  const detected = await fileTypeFromBuffer(input.buffer);
  if (detected?.mime && MIME_ALLOWED.has(detected.mime)) {
    return detected.mime;
  }

  const inferredByName = inferMimeFromFilename(input.filename);
  if (detected?.mime === "application/zip" && inferredByName === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    return inferredByName;
  }

  if (inferredByName && MIME_ALLOWED.has(inferredByName)) {
    return inferredByName;
  }

  if (input.browserMime && MIME_ALLOWED.has(input.browserMime)) {
    return input.browserMime;
  }

  throw new UploadValidationError(
    "UNSUPPORTED_FILE_TYPE",
    "Formato de arquivo não suportado. Use PDF, DOC, DOCX ou TXT.",
    400,
    { detectedMime: detected?.mime ?? null, browserMime: input.browserMime || null, inferredByName },
  );
}

export async function POST(request: Request) {
  const authResult = await requireSessionWithPermission({ modulo: "documentos", acao: "write" });
  if (authResult.response) return authResult.response;

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return apiError("VALIDATION_ERROR", "Arquivo obrigatório.", 400);
    }

    const titulo = String(formData.get("titulo") ?? "").trim();
    const tipoDocumento = String(formData.get("tipoDocumento") ?? "").trim() as TipoDocumento;
    const parseVinculosResult = parseVinculos(String(formData.get("vinculos") ?? "[]"));

    if (!titulo) {
      return apiError("VALIDATION_ERROR", "Título é obrigatório.", 400);
    }

    if (!parseVinculosResult.ok) {
      return apiError("INVALID_LINKS_PAYLOAD", parseVinculosResult.message, 400);
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    if (buffer.byteLength > MAX_UPLOAD_BYTES) {
      throw new UploadValidationError(
        "FILE_TOO_LARGE",
        `Arquivo excede o limite de ${Math.round(MAX_UPLOAD_BYTES / (1024 * 1024))}MB.`,
        413,
        { size: buffer.byteLength, maxBytes: MAX_UPLOAD_BYTES },
      );
    }

    const trustedMime = await resolveTrustedMime({
      filename: file.name,
      browserMime: file.type || "application/octet-stream",
      buffer,
    });

    const resultado = await uploadDocumento({
      filename: file.name,
      contentType: trustedMime,
      bytes: buffer,
      titulo,
      tipoDocumento,
      vinculos: parseVinculosResult.value,
    });

    await writeAuditLog({
      request,
      session: authResult.session,
      action: "upload",
      resource: "documentos",
      resourceId: resultado.documento.id,
      result: "success",
      details: {
        filename: file.name,
        contentType: trustedMime,
        size: buffer.byteLength,
      },
    });

    return NextResponse.json({
      documentoId: resultado.documento.id,
      arquivoId: resultado.arquivo.id,
      url: `/api/documentos/${resultado.documento.id}/arquivo`,
      sha256: resultado.arquivo.sha256,
      vinculos: resultado.vinculos,
    });
  } catch (error) {
    if (error instanceof UploadValidationError) {
      return apiError(error.code, error.message, error.status, error.details);
    }

    return apiError(
      "INTERNAL_ERROR",
      error instanceof Error ? error.message : "Falha ao processar upload de documento.",
      500,
    );
  }
}
