import "server-only";

import { google } from "googleapis";
import { eq } from "drizzle-orm";
import { getDataMode } from "@/lib/data-mode";
import { getDb } from "@/lib/database/client";
import { googleIntegracoesUsuario } from "@/lib/database/schema";
import { obterConfiguracoes } from "@/modules/administracao/application";
import { extrairGoogleWorkspaceConfig } from "@/modules/administracao/domain/google-workspace";
import type {
  AgendaEvent,
  CriarAgendaEventInput,
  GoogleAgendaConnectionStatus,
  GoogleCalendarConnection,
  GoogleCalendarInfo,
} from "@/modules/agenda/domain/google-calendar";

const GOOGLE_SCOPES = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/calendar.readonly",
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/drive.readonly",
];

const mockConnections = new Map<string, GoogleCalendarConnection>();
const mockEventsByUser = new Map<string, AgendaEvent[]>();

const MOCK_CALENDARS: GoogleCalendarInfo[] = [
  {
    id: "primary",
    resumo: "Agenda Jurídica Principal",
    primaria: true,
    selecionada: true,
    corFundo: "#C2E7FF",
    corTexto: "#0B57D0",
  },
  {
    id: "audiencias",
    resumo: "Audiências",
    corFundo: "#FCE8B2",
    corTexto: "#8D6E00",
  },
];

const MOCK_EVENTS: AgendaEvent[] = [
  {
    id: "mock-evt-001",
    titulo: "Audiência de instrução • Fazenda Atlas",
    inicio: new Date().toISOString(),
    fim: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    diaInteiro: false,
    calendarioId: "primary",
    calendarioResumo: "Agenda Jurídica Principal",
    linkExterno: "https://calendar.google.com",
    local: "Fórum Central",
  },
  {
    id: "mock-evt-002",
    titulo: "Prazo final • réplica em execução",
    inicio: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
    fim: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
    diaInteiro: false,
    calendarioId: "primary",
    calendarioResumo: "Agenda Jurídica Principal",
    linkExterno: "https://calendar.google.com",
  },
];

async function obterConfigGoogle() {
  const configuracoes = await obterConfiguracoes();
  return extrairGoogleWorkspaceConfig(configuracoes);
}

function criarOAuthClient(config: Awaited<ReturnType<typeof obterConfigGoogle>>) {
  if (!config.oauthClientId || !config.oauthClientSecret || !config.oauthRedirectUri) {
    throw new Error("OAuth Google incompleto. Configure Client ID, Client Secret e Redirect URI.");
  }

  return new google.auth.OAuth2(
    config.oauthClientId,
    config.oauthClientSecret,
    config.oauthRedirectUri,
  );
}

export async function criarGoogleAuthorizationUrl(state: string) {
  const config = await obterConfigGoogle();
  const client = criarOAuthClient(config);

  return client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: GOOGLE_SCOPES,
    state,
    include_granted_scopes: true,
  });
}

export async function trocarCodePorTokens(code: string) {
  const config = await obterConfigGoogle();
  const client = criarOAuthClient(config);
  const { tokens } = await client.getToken(code);
  client.setCredentials(tokens);

  const oauth2 = google.oauth2({ version: "v2", auth: client });
  const me = await oauth2.userinfo.get();

  return {
    emailGoogle: me.data.email ?? null,
    accessToken: tokens.access_token ?? "",
    refreshToken: tokens.refresh_token ?? null,
    tokenType: tokens.token_type ?? null,
    scope: tokens.scope ?? null,
    expiryDate: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null,
  };
}

async function obterConexaoMock(userId: string): Promise<GoogleCalendarConnection | null> {
  return mockConnections.get(userId) ?? null;
}

async function salvarConexaoMock(connection: GoogleCalendarConnection) {
  const atual = mockConnections.get(connection.userId);
  mockConnections.set(connection.userId, {
    ...atual,
    ...connection,
    selectedCalendarId: connection.selectedCalendarId ?? atual?.selectedCalendarId ?? "primary",
  });
}

async function removerConexaoMock(userId: string) {
  mockConnections.delete(userId);
  mockEventsByUser.delete(userId);
}

export async function obterConexaoGoogle(userId: string): Promise<GoogleCalendarConnection | null> {
  if (getDataMode() !== "real") {
    return obterConexaoMock(userId);
  }

  const db = getDb();
  const rows = await db
    .select()
    .from(googleIntegracoesUsuario)
    .where(eq(googleIntegracoesUsuario.userId, userId));

  const row = rows[0];
  if (!row) return null;

  return {
    id: row.id,
    userId: row.userId,
    emailGoogle: row.emailGoogle ?? null,
    accessToken: row.accessToken,
    refreshToken: row.refreshToken ?? null,
    tokenType: row.tokenType ?? null,
    scope: row.scope ?? null,
    expiryDate: row.expiryDate?.toISOString() ?? null,
    selectedCalendarId: row.selectedCalendarId ?? null,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
  };
}

export async function salvarConexaoGoogle(connection: GoogleCalendarConnection) {
  if (getDataMode() !== "real") {
    await salvarConexaoMock(connection);
    return;
  }

  const db = getDb();
  await db
    .insert(googleIntegracoesUsuario)
    .values({
      userId: connection.userId,
      emailGoogle: connection.emailGoogle ?? null,
      accessToken: connection.accessToken,
      refreshToken: connection.refreshToken ?? null,
      tokenType: connection.tokenType ?? null,
      scope: connection.scope ?? null,
      expiryDate: connection.expiryDate ? new Date(connection.expiryDate) : null,
      selectedCalendarId: connection.selectedCalendarId ?? null,
      metadata: connection.metadata ?? {},
    })
    .onConflictDoUpdate({
      target: googleIntegracoesUsuario.userId,
      set: {
        emailGoogle: connection.emailGoogle ?? null,
        accessToken: connection.accessToken,
        refreshToken: connection.refreshToken ?? undefined,
        tokenType: connection.tokenType ?? undefined,
        scope: connection.scope ?? undefined,
        expiryDate: connection.expiryDate ? new Date(connection.expiryDate) : null,
        selectedCalendarId: connection.selectedCalendarId ?? undefined,
        metadata: connection.metadata ?? {},
        updatedAt: new Date(),
      },
    });
}

export async function removerConexaoGoogle(userId: string) {
  if (getDataMode() !== "real") {
    await removerConexaoMock(userId);
    return;
  }

  const db = getDb();
  await db.delete(googleIntegracoesUsuario).where(eq(googleIntegracoesUsuario.userId, userId));
}

async function garantirClientAutenticado(connection: GoogleCalendarConnection) {
  const config = await obterConfigGoogle();
  const client = criarOAuthClient(config);
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

  return client;
}

export async function listarCalendariosGoogle(userId: string): Promise<GoogleCalendarInfo[]> {
  const connection = await obterConexaoGoogle(userId);
  if (!connection) return [];

  if (getDataMode() !== "real") {
    return MOCK_CALENDARS.map((item) => ({
      ...item,
      selecionada: item.id === (connection.selectedCalendarId ?? "primary"),
    }));
  }

  const client = await garantirClientAutenticado(connection);
  const calendar = google.calendar({ version: "v3", auth: client });
  const res = await calendar.calendarList.list({
    minAccessRole: "reader",
    showHidden: false,
  });

  const selected = connection.selectedCalendarId ?? "primary";
  return (res.data.items ?? []).map((item) => ({
    id: item.id ?? "",
    resumo: item.summary ?? item.id ?? "Calendário",
    descricao: item.description ?? undefined,
    primaria: Boolean(item.primary),
    selecionada: (item.id ?? "") === selected,
    corFundo: item.backgroundColor ?? undefined,
    corTexto: item.foregroundColor ?? undefined,
  }));
}

export async function listarEventosGoogle(
  userId: string,
  calendarId?: string,
  intervalo?: { inicio: string; fim: string },
): Promise<AgendaEvent[]> {
  const connection = await obterConexaoGoogle(userId);
  if (!connection) return [];

  const effectiveCalendarId = calendarId || connection.selectedCalendarId || "primary";

  if (getDataMode() !== "real") {
    const eventos = mockEventsByUser.get(userId) ?? MOCK_EVENTS;
    return eventos.filter((item) => item.calendarioId === effectiveCalendarId);
  }

  const client = await garantirClientAutenticado(connection);
  const calendar = google.calendar({ version: "v3", auth: client });
  const res = await calendar.events.list({
    calendarId: effectiveCalendarId,
    singleEvents: true,
    orderBy: "startTime",
    timeMin: intervalo?.inicio ?? new Date().toISOString(),
    timeMax:
      intervalo?.fim ??
      new Date(Date.now() + 1000 * 60 * 60 * 24 * 31).toISOString(),
    maxResults: 100,
  });

  return (res.data.items ?? []).map((item) => {
    const inicio = item.start?.dateTime ?? item.start?.date ?? new Date().toISOString();
    const fim = item.end?.dateTime ?? item.end?.date ?? undefined;
    const diaInteiro = Boolean(item.start?.date && !item.start?.dateTime);

    return {
      id: item.id ?? crypto.randomUUID(),
      titulo: item.summary ?? "(Sem título)",
      descricao: item.description ?? undefined,
      inicio,
      fim,
      diaInteiro,
      local: item.location ?? undefined,
      calendarioId: effectiveCalendarId,
      calendarioResumo: undefined,
      linkExterno: item.htmlLink ?? undefined,
    } satisfies AgendaEvent;
  });
}

export async function selecionarCalendarioGoogle(userId: string, calendarId: string) {
  const connection = await obterConexaoGoogle(userId);
  if (!connection) {
    throw new Error("Nenhuma conexão Google encontrada para o usuário.");
  }

  await salvarConexaoGoogle({
    ...connection,
    selectedCalendarId: calendarId,
  });
}

export async function criarEventoGoogle(userId: string, input: CriarAgendaEventInput): Promise<AgendaEvent> {
  const connection = await obterConexaoGoogle(userId);
  if (!connection) {
    throw new Error("Conecte sua conta Google antes de criar compromissos.");
  }

  const calendarioId = input.calendarioId || connection.selectedCalendarId || "primary";

  if (getDataMode() !== "real") {
    const existente = mockEventsByUser.get(userId) ?? MOCK_EVENTS;
    const evento: AgendaEvent = {
      id: `mock-evt-${Date.now()}`,
      titulo: input.titulo,
      descricao: input.descricao,
      inicio: input.inicio,
      fim: input.fim,
      diaInteiro: Boolean(input.diaInteiro),
      local: input.local,
      calendarioId,
      calendarioResumo: MOCK_CALENDARS.find((item) => item.id === calendarioId)?.resumo ?? "Agenda Jurídica Principal",
      linkExterno: "https://calendar.google.com",
    };
    mockEventsByUser.set(userId, [evento, ...existente]);
    return evento;
  }

  const client = await garantirClientAutenticado(connection);
  const calendar = google.calendar({ version: "v3", auth: client });

  const resource = input.diaInteiro
    ? {
        summary: input.titulo,
        description: input.descricao,
        location: input.local,
        start: { date: input.inicio.slice(0, 10) },
        end: { date: (input.fim || input.inicio).slice(0, 10) },
      }
    : {
        summary: input.titulo,
        description: input.descricao,
        location: input.local,
        start: { dateTime: input.inicio },
        end: { dateTime: input.fim || new Date(new Date(input.inicio).getTime() + 60 * 60 * 1000).toISOString() },
      };

  const res = await calendar.events.insert({
    calendarId: calendarioId,
    requestBody: resource,
  });

  const item = res.data;
  const inicio = item.start?.dateTime ?? item.start?.date ?? input.inicio;
  const fim = item.end?.dateTime ?? item.end?.date ?? input.fim;
  const diaInteiro = Boolean(item.start?.date && !item.start?.dateTime);

  return {
    id: item.id ?? crypto.randomUUID(),
    titulo: item.summary ?? input.titulo,
    descricao: item.description ?? input.descricao,
    inicio,
    fim: fim ?? undefined,
    diaInteiro,
    local: item.location ?? input.local,
    calendarioId,
    calendarioResumo: undefined,
    linkExterno: item.htmlLink ?? undefined,
  };
}

export async function obterStatusConexaoGoogleAgenda(userId: string): Promise<GoogleAgendaConnectionStatus> {
  const config = await obterConfigGoogle();
  const connection = await obterConexaoGoogle(userId);

  if (!connection) {
    const pendencia =
      config.authMode === "service_account"
        ? "A Agenda exige OAuth por usuário para acessar calendários individuais."
        : "Conecte sua conta Google para carregar calendários e eventos reais.";

    return {
      conectada: false,
      calendarios: [],
      pendencia,
    };
  }

  const calendarios = await listarCalendariosGoogle(userId);
  return {
    conectada: true,
    emailGoogle: connection.emailGoogle ?? null,
    selectedCalendarId: connection.selectedCalendarId ?? "primary",
    calendarios,
  };
}
