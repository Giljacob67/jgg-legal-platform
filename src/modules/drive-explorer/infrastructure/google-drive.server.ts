import "server-only";

import { google } from "googleapis";
import type { drive_v3 } from "googleapis";
import { extrairGoogleWorkspaceConfig } from "@/modules/administracao/domain/google-workspace";
import { obterConfiguracoes } from "@/modules/administracao/application";
import { obterConexaoGoogle, salvarConexaoGoogle } from "@/modules/agenda/infrastructure/google-calendar.server";
import type {
  DriveExplorerBreadcrumb,
  DriveExplorerItem,
  DriveExplorerResultado,
} from "@/modules/drive-explorer/domain/types";

const FOLDER_MIME = "application/vnd.google-apps.folder";
const GOOGLE_DOC_MIME = "application/vnd.google-apps.document";
const GOOGLE_SHEET_MIME = "application/vnd.google-apps.spreadsheet";
const GOOGLE_SLIDE_MIME = "application/vnd.google-apps.presentation";
const MIME_TYPES_IMPORTAVEIS = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  GOOGLE_DOC_MIME,
  GOOGLE_SHEET_MIME,
  GOOGLE_SLIDE_MIME,
]);

function ehFolderIdConfiguradoInvalido(valor?: string) {
  const limpo = (valor ?? "").trim().toLowerCase();
  return !limpo || limpo === "." || limpo === "/" || limpo === "root";
}

function formatarBytes(bytes?: number) {
  if (!bytes || Number.isNaN(bytes) || bytes <= 0) return undefined;
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toFixed(value >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

async function obterConfigGoogle() {
  const configuracoes = await obterConfiguracoes();
  return extrairGoogleWorkspaceConfig(configuracoes);
}

async function criarClientDriveAutenticado(userId: string) {
  const connection = await obterConexaoGoogle(userId);
  if (!connection) {
    throw new Error("Conta Google ainda não conectada para este usuário.");
  }

  const config = await obterConfigGoogle();
  if (!config.oauthClientId || !config.oauthClientSecret || !config.oauthRedirectUri) {
    throw new Error("OAuth Google incompleto. Configure Client ID, Client Secret e Redirect URI.");
  }

  const client = new google.auth.OAuth2(
    config.oauthClientId,
    config.oauthClientSecret,
    config.oauthRedirectUri,
  );

  client.setCredentials({
    access_token: connection.accessToken,
    refresh_token: connection.refreshToken ?? undefined,
    token_type: connection.tokenType ?? undefined,
    scope: connection.scope ?? undefined,
    expiry_date: connection.expiryDate ? new Date(connection.expiryDate).getTime() : undefined,
  });

  const expiry = connection.expiryDate ? new Date(connection.expiryDate).getTime() : undefined;
  const expirada = !expiry || expiry - Date.now() < 60_000;

  if (expirada && connection.refreshToken) {
    const { credentials } = await client.refreshAccessToken();
    client.setCredentials(credentials);
    await salvarConexaoGoogle({
      ...connection,
      accessToken: credentials.access_token ?? connection.accessToken,
      refreshToken: credentials.refresh_token ?? connection.refreshToken,
      tokenType: credentials.token_type ?? connection.tokenType,
      scope: credentials.scope ?? connection.scope,
      expiryDate: credentials.expiry_date
        ? new Date(credentials.expiry_date).toISOString()
        : connection.expiryDate,
    });
  }

  return google.drive({ version: "v3", auth: client });
}

async function obterMetadataPasta(
  drive: drive_v3.Drive,
  folderId: string,
): Promise<{ id: string; name: string; parents: string[] }> {
  const res = await drive.files.get({
    fileId: folderId,
    supportsAllDrives: true,
    fields: "id,name,parents",
  });
  return {
    id: res.data.id ?? folderId,
    name: res.data.name ?? "Pasta",
    parents: res.data.parents ?? [],
  };
}

async function montarBreadcrumbs(
  drive: drive_v3.Drive,
  pastaId: string,
  pastaRaizId?: string,
): Promise<DriveExplorerBreadcrumb[]> {
  const breadcrumbs: DriveExplorerBreadcrumb[] = [];
  let cursorId: string | undefined = pastaId;
  let guard = 0;

  while (cursorId && guard < 12) {
    const atual = await obterMetadataPasta(drive, cursorId);
    breadcrumbs.unshift({ id: atual.id, nome: atual.name });
    if (!atual.parents.length || cursorId === pastaRaizId) break;
    cursorId = atual.parents[0];
    guard += 1;
  }

  return breadcrumbs;
}

function mapearItem(file: drive_v3.Schema$File): DriveExplorerItem {
  const tamanhoBytes = file.size ? Number(file.size) : undefined;
  return {
    id: file.id ?? "",
    nome: file.name ?? "Sem nome",
    mimeType: file.mimeType ?? "application/octet-stream",
    tipo: file.mimeType === FOLDER_MIME ? "pasta" : "arquivo",
    webViewLink: file.webViewLink ?? undefined,
    webContentLink: file.webContentLink ?? undefined,
    iconLink: file.iconLink ?? undefined,
    tamanhoBytes,
    tamanhoLabel: formatarBytes(tamanhoBytes),
    modificadoEm: file.modifiedTime ?? undefined,
    importavel: file.mimeType === FOLDER_MIME ? false : MIME_TYPES_IMPORTAVEIS.has(file.mimeType ?? ""),
  };
}

function ajustarNomeExportado(nomeBase: string, extensao: string) {
  const limpo = nomeBase.trim();
  return limpo.toLowerCase().endsWith(`.${extensao}`) ? limpo : `${limpo}.${extensao}`;
}

export async function listarArquivosDriveExplorer(
  userId: string,
  params?: { folderId?: string; query?: string },
): Promise<DriveExplorerResultado> {
  const config = await obterConfigGoogle();
  const drive = await criarClientDriveAutenticado(userId);
  const pastaRaizId = ehFolderIdConfiguradoInvalido(config.driveSharedFolderId)
    ? undefined
    : config.driveSharedFolderId.trim();
  const pastaAtualId = ehFolderIdConfiguradoInvalido(params?.folderId)
    ? pastaRaizId || "root"
    : params?.folderId?.trim() || pastaRaizId || "root";
  const query = params?.query?.trim() ?? "";

  const filtros = [`trashed = false`];
  if (query) {
    filtros.push(`name contains '${query.replace(/'/g, "\\'")}'`);
    filtros.push(`'${pastaAtualId}' in parents`);
  } else {
    filtros.push(`'${pastaAtualId}' in parents`);
  }

  let arquivos: drive_v3.Schema$File[] = [];
  let pastaAtual: { id: string; nome: string };
  let breadcrumbs: DriveExplorerBreadcrumb[];

  try {
    const resposta = await drive.files.list({
      q: filtros.join(" and "),
      includeItemsFromAllDrives: true,
      supportsAllDrives: true,
      corpora: "allDrives",
      pageSize: 100,
      orderBy: "folder,name_natural",
      fields:
        "files(id,name,mimeType,webViewLink,webContentLink,iconLink,size,modifiedTime,parents)",
    });
    arquivos = resposta.data.files ?? [];

    pastaAtual =
      pastaAtualId === "root"
        ? { id: "root", nome: "Meu Drive" }
        : await obterMetadataPasta(drive, pastaAtualId).then((item) => ({ id: item.id, nome: item.name }));

    breadcrumbs =
      pastaAtualId === "root"
        ? [{ id: "root", nome: "Meu Drive" }]
        : await montarBreadcrumbs(drive, pastaAtualId, pastaRaizId);
  } catch (error) {
    const codigo = typeof error === "object" && error !== null && "code" in error ? String((error as { code?: unknown }).code) : "";
    const mensagem =
      typeof error === "object" && error !== null && "message" in error ? String((error as { message?: unknown }).message) : "";
    const precisaFallback =
      pastaAtualId !== "root" &&
      (codigo === "404" || mensagem.toLowerCase().includes("file not found"));

    if (!precisaFallback) {
      throw error;
    }

    const resposta = await drive.files.list({
      q: "trashed = false and 'root' in parents",
      includeItemsFromAllDrives: true,
      supportsAllDrives: true,
      corpora: "allDrives",
      pageSize: 100,
      orderBy: "folder,name_natural",
      fields:
        "files(id,name,mimeType,webViewLink,webContentLink,iconLink,size,modifiedTime,parents)",
    });
    arquivos = resposta.data.files ?? [];
    pastaAtual = { id: "root", nome: "Meu Drive" };
    breadcrumbs = [{ id: "root", nome: "Meu Drive" }];
  }

  return {
    pastaAtual,
    breadcrumbs,
    itens: arquivos.map(mapearItem),
    query,
    pastaRaizId,
    pastaRaizConfigurada: Boolean(pastaRaizId),
  };
}

export async function buscarArquivosImportaveisDrive(
  userId: string,
  query: string,
): Promise<DriveExplorerItem[]> {
  const termo = query.trim();
  if (!termo) return [];

  const drive = await criarClientDriveAutenticado(userId);
  const safeQuery = termo.replace(/'/g, "\\'");
  const mimeQuery = [
    "mimeType = 'application/pdf'",
    "mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'",
    "mimeType = 'text/plain'",
    `mimeType = '${GOOGLE_DOC_MIME}'`,
    `mimeType = '${GOOGLE_SHEET_MIME}'`,
    `mimeType = '${GOOGLE_SLIDE_MIME}'`,
  ].join(" or ");

  const res = await drive.files.list({
    q: `trashed = false and mimeType != '${FOLDER_MIME}' and name contains '${safeQuery}' and (${mimeQuery})`,
    includeItemsFromAllDrives: true,
    supportsAllDrives: true,
    corpora: "allDrives",
    pageSize: 20,
    orderBy: "modifiedTime desc",
    fields:
      "files(id,name,mimeType,webViewLink,webContentLink,iconLink,size,modifiedTime,parents)",
  });

  return (res.data.files ?? []).map(mapearItem);
}

export async function baixarArquivoDriveParaImportacao(
  userId: string,
  fileId: string,
): Promise<{ filename: string; contentType: string; bytes: Buffer; mimeTypeOrigem: string; webViewLink?: string }> {
  const drive = await criarClientDriveAutenticado(userId);
  const meta = await drive.files.get({
    fileId,
    supportsAllDrives: true,
    fields: "id,name,mimeType,webViewLink",
  });

  const nome = meta.data.name ?? "documento";
  const mimeTypeOrigem = meta.data.mimeType ?? "application/octet-stream";
  const webViewLink = meta.data.webViewLink ?? undefined;

  if (mimeTypeOrigem === GOOGLE_DOC_MIME || mimeTypeOrigem === GOOGLE_SHEET_MIME || mimeTypeOrigem === GOOGLE_SLIDE_MIME) {
    const res = await drive.files.export(
      { fileId, mimeType: "application/pdf" },
      { responseType: "arraybuffer" },
    );
    return {
      filename: ajustarNomeExportado(nome, "pdf"),
      contentType: "application/pdf",
      bytes: Buffer.from(res.data as ArrayBuffer),
      mimeTypeOrigem,
      webViewLink,
    };
  }

  if (!MIME_TYPES_IMPORTAVEIS.has(mimeTypeOrigem)) {
    throw new Error("Formato do Google Drive ainda não suportado para importação nesta etapa.");
  }

  const res = await drive.files.get(
    { fileId, alt: "media", supportsAllDrives: true },
    { responseType: "arraybuffer" },
  );

  return {
    filename: nome,
    contentType: mimeTypeOrigem,
    bytes: Buffer.from(res.data as ArrayBuffer),
    mimeTypeOrigem,
    webViewLink,
  };
}
