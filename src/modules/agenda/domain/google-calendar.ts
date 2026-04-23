export interface GoogleCalendarConnection {
  id?: string;
  userId: string;
  emailGoogle?: string | null;
  accessToken: string;
  refreshToken?: string | null;
  tokenType?: string | null;
  scope?: string | null;
  expiryDate?: string | null;
  selectedCalendarId?: string | null;
  metadata?: Record<string, unknown>;
}

export interface GoogleCalendarInfo {
  id: string;
  resumo: string;
  descricao?: string;
  primaria?: boolean;
  selecionada?: boolean;
  corFundo?: string;
  corTexto?: string;
}

export interface AgendaEvent {
  id: string;
  titulo: string;
  descricao?: string;
  inicio: string;
  fim?: string;
  diaInteiro: boolean;
  local?: string;
  calendarioId: string;
  calendarioResumo?: string;
  linkExterno?: string;
  vinculoTipo?: "caso" | "pedido" | "cliente";
  vinculoId?: string;
  vinculoLabel?: string;
}

export interface CriarAgendaEventInput {
  titulo: string;
  descricao?: string;
  inicio: string;
  fim?: string;
  diaInteiro?: boolean;
  local?: string;
  calendarioId?: string;
  vinculoTipo?: "caso" | "pedido" | "cliente";
  vinculoId?: string;
  vinculoLabel?: string;
}

export interface GoogleAgendaConnectionStatus {
  conectada: boolean;
  emailGoogle?: string | null;
  selectedCalendarId?: string | null;
  calendarios: GoogleCalendarInfo[];
  pendencia?: string;
}
