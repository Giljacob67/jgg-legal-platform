import type { ConfiguracaoSistema } from "@/modules/administracao/domain/types";

export type GoogleAuthMode = "service_account" | "oauth_usuario" | "hibrido";

export interface GoogleWorkspaceConfig {
  authMode: GoogleAuthMode;
  oauthClientId: string;
  oauthClientSecret: string;
  oauthRedirectUri: string;
  serviceAccountKey: string;
  driveSharedFolderId: string;
  calendarPrimaryId: string;
  calendarSyncScope: string;
}

export interface GoogleWorkspaceReadiness {
  agendaOk: boolean;
  driveExplorerOk: boolean;
  bibliotecaSyncOk: boolean;
  authMode: GoogleAuthMode;
  pendenciasAgenda: string[];
  pendenciasDriveExplorer: string[];
  pendenciasBiblioteca: string[];
}

function normalizarDriveSharedFolderId(valor?: string) {
  const limpo = (valor ?? "").trim();
  if (!limpo || limpo === "." || limpo === "/" || limpo.toLowerCase() === "root") {
    return "";
  }
  const matchFolder = limpo.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  if (matchFolder?.[1]) {
    return matchFolder[1];
  }
  const matchOpenId = limpo.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (matchOpenId?.[1]) {
    return matchOpenId[1];
  }
  return limpo;
}

export function extrairGoogleWorkspaceConfig(configuracoes: ConfiguracaoSistema[]): GoogleWorkspaceConfig {
  const mapa = new Map(configuracoes.map((item) => [item.chave, item.valor]));

  const authMode = (mapa.get("google_auth_mode") || "service_account") as GoogleAuthMode;

  return {
    authMode,
    oauthClientId: mapa.get("google_oauth_client_id") ?? "",
    oauthClientSecret: mapa.get("google_oauth_client_secret") ?? "",
    oauthRedirectUri: mapa.get("google_oauth_redirect_uri") ?? "",
    serviceAccountKey: mapa.get("google_service_account_key") ?? "",
    driveSharedFolderId: normalizarDriveSharedFolderId(mapa.get("google_drive_shared_folder_id")),
    calendarPrimaryId: mapa.get("google_calendar_primary_id") ?? "primary",
    calendarSyncScope: mapa.get("google_calendar_sync_scope") ?? "operacao_juridica",
  };
}

function possuiOAuth(config: GoogleWorkspaceConfig) {
  return Boolean(
    config.oauthClientId.trim() &&
      config.oauthClientSecret.trim() &&
      config.oauthRedirectUri.trim(),
  );
}

function possuiServiceAccount(config: GoogleWorkspaceConfig) {
  return Boolean(config.serviceAccountKey.trim());
}

export function avaliarGoogleWorkspace(config: GoogleWorkspaceConfig): GoogleWorkspaceReadiness {
  const oauthOk = possuiOAuth(config);
  const serviceAccountOk = possuiServiceAccount(config);
  const driveFolderOk = Boolean(config.driveSharedFolderId.trim());
  const calendarIdOk = Boolean(config.calendarPrimaryId.trim());

  const pendenciasAgenda: string[] = [];
  const pendenciasDriveExplorer: string[] = [];
  const pendenciasBiblioteca: string[] = [];

  if (config.authMode === "service_account") {
    pendenciasAgenda.push("Agenda profissional precisa de OAuth por usuário para refletir calendários individuais.");
    if (!serviceAccountOk) {
      pendenciasDriveExplorer.push("JSON da service account ausente.");
      pendenciasBiblioteca.push("JSON da service account ausente.");
    }
  }

  if (config.authMode === "oauth_usuario" || config.authMode === "hibrido") {
    if (!oauthOk) {
      pendenciasAgenda.push("Client ID, Client Secret e Redirect URI OAuth são obrigatórios.");
      pendenciasDriveExplorer.push("Client ID, Client Secret e Redirect URI OAuth são obrigatórios.");
    }
  } else {
    pendenciasDriveExplorer.push("Explorer do Drive fica limitado sem OAuth por usuário.");
  }

  if (!calendarIdOk) {
    pendenciasAgenda.push("Calendar ID padrão ainda não definido.");
  }

  if (!driveFolderOk) {
    pendenciasDriveExplorer.push("Pasta compartilhada do Drive ainda não definida.");
    pendenciasBiblioteca.push("Pasta raiz do Drive institucional ainda não definida.");
  }

  if (!serviceAccountOk) {
    pendenciasBiblioteca.push("Biblioteca jurídica ainda depende de service account para sync institucional.");
  }

  const agendaOk =
    (config.authMode === "oauth_usuario" || config.authMode === "hibrido") &&
    oauthOk &&
    calendarIdOk;
  const driveExplorerOk =
    (config.authMode === "oauth_usuario" || config.authMode === "hibrido") &&
    oauthOk;
  const bibliotecaSyncOk = serviceAccountOk && driveFolderOk;

  return {
    agendaOk,
    driveExplorerOk,
    bibliotecaSyncOk,
    authMode: config.authMode,
    pendenciasAgenda,
    pendenciasDriveExplorer,
    pendenciasBiblioteca,
  };
}
