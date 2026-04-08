import { NextResponse } from "next/server";
import { fileTypeFromBuffer } from "file-type";
import { getBibliotecaRepo } from "@/modules/biblioteca-conhecimento/infrastructure/mockBibliotecaRepository";
import { processarDocumento } from "@/modules/biblioteca-conhecimento/infrastructure/processamentoPipeline.server";
import { inferirTipoPorPasta } from "@/modules/biblioteca-conhecimento/domain/types";
import type { TipoDocumentoBC } from "@/modules/biblioteca-conhecimento/domain/types";
import { requireSessionWithPermission } from "@/lib/api-auth";
import { apiError } from "@/lib/api-response";
import { writeAuditLog } from "@/lib/security/audit-log";

const MAX_BYTES = Number(process.env.BIBLIOTECA_UPLOAD_MAX_BYTES ?? 20 * 1024 * 1024);
const MIME_ALLOWED = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
]);

class BibliotecaUploadError extends Error {
  constructor(
    public readonly code: "FILE_TOO_LARGE" | "UNSUPPORTED_FILE_TYPE" | "VALIDATION_ERROR",
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

  throw new BibliotecaUploadError(
    "UNSUPPORTED_FILE_TYPE",
    "Formato de arquivo não suportado. Use PDF, DOCX ou TXT.",
    415,
    { detectedMime: detected?.mime ?? null, browserMime: input.browserMime || null, inferredByName },
  );
}

export async function POST(request: Request) {
  const authResult = await requireSessionWithPermission({ modulo: "biblioteca_juridica", acao: "write" });
  if (authResult.response) return authResult.response;

  try {
    const formData = await request.formData();
    const arquivo = formData.get("arquivo") as File | null;
    const titulo = (formData.get("titulo") as string | null)?.trim();
    const tipoManual = formData.get("tipo") as TipoDocumentoBC | null;

    if (!(arquivo instanceof File)) {
      throw new BibliotecaUploadError("VALIDATION_ERROR", "Arquivo não enviado.", 400);
    }

    const buffer = Buffer.from(await arquivo.arrayBuffer());
    if (buffer.byteLength > MAX_BYTES) {
      throw new BibliotecaUploadError(
        "FILE_TOO_LARGE",
        `Arquivo excede o limite de ${Math.round(MAX_BYTES / (1024 * 1024))} MB.`,
        413,
        { size: buffer.byteLength, maxBytes: MAX_BYTES },
      );
    }

    const mimeType = await resolveTrustedMime({
      filename: arquivo.name,
      browserMime: arquivo.type || "application/octet-stream",
      buffer,
    });

    const nomeArquivo = arquivo.name;
    const tipoInferido = tipoManual ?? inferirTipoPorPasta(nomeArquivo);
    const tituloFinal = titulo || nomeArquivo.replace(/\.[^.]+$/, "");

    const repo = getBibliotecaRepo();
    const doc = await repo.criar({
      titulo: tituloFinal,
      tipo: tipoInferido,
      fonte: "upload_manual",
      mimeType,
      tamanhoBytes: buffer.byteLength,
    });

    const { chunksGerados } = await processarDocumento(doc.id, buffer, mimeType);
    const docAtualizado = (await repo.listar()).find((d) => d.id === doc.id) ?? doc;

    await writeAuditLog({
      request,
      session: authResult.session,
      action: "upload",
      resource: "biblioteca",
      resourceId: doc.id,
      result: "success",
      details: {
        filename: nomeArquivo,
        mimeType,
        size: buffer.byteLength,
      },
    });

    return NextResponse.json({ documento: docAtualizado, chunksGerados }, { status: 201 });
  } catch (error) {
    if (error instanceof BibliotecaUploadError) {
      return apiError(error.code, error.message, error.status, error.details);
    }

    return apiError("INTERNAL_ERROR", error instanceof Error ? error.message : "Erro no upload da biblioteca.", 500);
  }
}
