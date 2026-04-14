import { NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import type { TipoDocumento } from "@/modules/documentos/domain/types";
import { requireAuth } from "@/lib/api-auth";
import { registrarUploadClienteDocumento } from "@/modules/documentos/application/registrarUploadClienteDocumento";
import { validarTipoDocumento } from "@/modules/documentos/application/validation";

const MIME_TYPES_PERMITIDOS = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
  "application/msword", // .doc
  "text/plain",
];

const TAMANHO_MAXIMO_BYTES = 20 * 1024 * 1024; // 20 MB

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
  const unauth = await requireAuth();
  if (unauth) return unauth;

  try {
    const body = (await request.json()) as HandleUploadBody;

    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (_pathname, clientPayload) => {
        const payload = parseTokenPayload(clientPayload);

        // Validar tamanho antes de gerar token
        if (payload.sizeBytes > TAMANHO_MAXIMO_BYTES) {
          throw new Error(`Arquivo excede o limite de ${TAMANHO_MAXIMO_BYTES / 1024 / 1024}MB.`);
        }

        return {
          allowedContentTypes: MIME_TYPES_PERMITIDOS,
          maximumSizeInBytes: TAMANHO_MAXIMO_BYTES,
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

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Falha no upload cliente de documento.",
      },
      { status: 400 },
    );
  }
}
