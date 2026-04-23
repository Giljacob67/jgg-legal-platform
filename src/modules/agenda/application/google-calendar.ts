import type { AgendaEvent, GoogleAgendaConnectionStatus } from "@/modules/agenda/domain/google-calendar";
import {
  criarGoogleAuthorizationUrl,
  listarEventosGoogle,
  obterStatusConexaoGoogleAgenda,
  removerConexaoGoogle,
  salvarConexaoGoogle,
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
