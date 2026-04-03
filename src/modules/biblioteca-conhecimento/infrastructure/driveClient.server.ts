/**
 * Google Drive client usando Service Account.
 * Server-side only — nunca importe em Client Components.
 *
 * Variáveis de ambiente necessárias:
 *   GOOGLE_SERVICE_ACCOUNT_KEY  — JSON completo da service account (string)
 *   GOOGLE_DRIVE_FOLDER_ID      — ID da pasta raiz a sincronizar
 */

import { google } from "googleapis";
import type { drive_v3 } from "googleapis";

// Mime types que sabemos extrair texto
const MIME_SUPORTADOS = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.google-apps.document", // Google Docs (export como texto)
  "text/plain",
]);

const MIME_GOOGLE_DOC = "application/vnd.google-apps.document";

export interface ArquivoDrive {
  id: string;
  nome: string;
  mimeType: string;
  folderPath: string;   // caminho completo, ex: "01_Jurídico/Clientes Ativos/ATLAS"
  tamanhoBytes?: number;
  modificadoEm?: string;
}

function criarAuth() {
  const keyRaw = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!keyRaw) throw new Error("GOOGLE_SERVICE_ACCOUNT_KEY não configurada.");
  const key = JSON.parse(keyRaw) as object;
  return new google.auth.GoogleAuth({
    credentials: key,
    scopes: ["https://www.googleapis.com/auth/drive.readonly"],
  });
}

export function isDriveConfigurado(): boolean {
  return !!(process.env.GOOGLE_SERVICE_ACCOUNT_KEY && process.env.GOOGLE_DRIVE_FOLDER_ID);
}

/**
 * Lista recursivamente todos os arquivos suportados a partir de uma pasta.
 */
export async function listarArquivosDrive(
  pastaId?: string,
  folderPath = ""
): Promise<ArquivoDrive[]> {
  const auth = criarAuth();
  const drive = google.drive({ version: "v3", auth });
  const raizId = pastaId ?? process.env.GOOGLE_DRIVE_FOLDER_ID!;

  const arquivos: ArquivoDrive[] = [];
  await _listarRecursivo(drive, raizId, folderPath, arquivos);
  return arquivos;
}

async function _listarRecursivo(
  drive: drive_v3.Drive,
  pastaId: string,
  folderPath: string,
  resultado: ArquivoDrive[],
  pageToken?: string
): Promise<void> {
  const res = await drive.files.list({
    q: `'${pastaId}' in parents and trashed = false`,
    fields: "nextPageToken, files(id, name, mimeType, size, modifiedTime)",
    pageToken,
    pageSize: 100,
  });

  const files = res.data.files ?? [];
  const nextToken = res.data.nextPageToken ?? undefined;

  for (const file of files) {
    if (!file.id || !file.name || !file.mimeType) continue;

    if (file.mimeType === "application/vnd.google-apps.folder") {
      // Recursa dentro da subpasta
      const subPath = folderPath ? `${folderPath}/${file.name}` : file.name;
      await _listarRecursivo(drive, file.id, subPath, resultado);
    } else if (MIME_SUPORTADOS.has(file.mimeType)) {
      resultado.push({
        id: file.id,
        nome: file.name,
        mimeType: file.mimeType,
        folderPath,
        tamanhoBytes: file.size ? parseInt(file.size) : undefined,
        modificadoEm: file.modifiedTime ?? undefined,
      });
    }
  }

  if (nextToken) {
    await _listarRecursivo(drive, pastaId, folderPath, resultado, nextToken);
  }
}

/**
 * Baixa o conteúdo de um arquivo como Buffer.
 * Google Docs são exportados como texto plain.
 */
export async function baixarArquivoDrive(
  fileId: string,
  mimeType: string
): Promise<{ buffer: Buffer; mimeTypeEfetivo: string }> {
  const auth = criarAuth();
  const drive = google.drive({ version: "v3", auth });

  if (mimeType === MIME_GOOGLE_DOC) {
    // Exporta Google Doc como texto
    const res = await drive.files.export(
      { fileId, mimeType: "text/plain" },
      { responseType: "arraybuffer" }
    );
    return {
      buffer: Buffer.from(res.data as ArrayBuffer),
      mimeTypeEfetivo: "text/plain",
    };
  }

  // Download binário para PDF/DOCX/TXT
  const res = await drive.files.get(
    { fileId, alt: "media" },
    { responseType: "arraybuffer" }
  );

  return {
    buffer: Buffer.from(res.data as ArrayBuffer),
    mimeTypeEfetivo: mimeType,
  };
}
