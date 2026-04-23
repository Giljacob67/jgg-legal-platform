import type { AgendaEvent, CriarAgendaEventInput, GoogleAgendaConnectionStatus } from "@/modules/agenda/domain/google-calendar";
import {
  atualizarEventoGoogle,
  criarEventoGoogle,
  criarGoogleAuthorizationUrl,
  excluirEventoGoogle,
  listarEventosGoogle,
  obterStatusConexaoGoogleAgenda,
  removerConexaoGoogle,
  salvarConexaoGoogle,
  selecionarCalendarioGoogle,
  trocarCodePorTokens,
} from "@/modules/agenda/infrastructure/google-calendar.server";

export function iniciarConexaoGoogleAgenda(state: string) {
  return criarGoogleAuthorizationUrl(state);
}

export function obterStatusAgendaGoogle(userId: string): Promise<GoogleAgendaConnectionStatus> {
  return obterStatusConexaoGoogleAgenda(userId);
}

export function listarEventosAgendaGoogle(
  userId: string,
  calendarId?: string,
  intervalo?: { inicio: string; fim: string },
): Promise<AgendaEvent[]> {
  return listarEventosGoogle(userId, calendarId, intervalo);
}

export async function concluirConexaoGoogleAgenda(
  userId: string,
  code: string,
  selectedCalendarId?: string,
) {
  const tokens = await trocarCodePorTokens(code);
  await salvarConexaoGoogle({
    userId,
    ...tokens,
    selectedCalendarId: selectedCalendarId ?? "primary",
  });
}

export function desconectarGoogleAgenda(userId: string) {
  return removerConexaoGoogle(userId);
}

export function definirCalendarioAgendaGoogle(userId: string, calendarId: string) {
  return selecionarCalendarioGoogle(userId, calendarId);
}

export function criarCompromissoAgendaGoogle(userId: string, input: CriarAgendaEventInput) {
  return criarEventoGoogle(userId, input);
}

export function atualizarCompromissoAgendaGoogle(userId: string, eventId: string, input: CriarAgendaEventInput) {
  return atualizarEventoGoogle(userId, eventId, input);
}

export function excluirCompromissoAgendaGoogle(userId: string, eventId: string, calendarId?: string) {
  return excluirEventoGoogle(userId, eventId, calendarId);
}
