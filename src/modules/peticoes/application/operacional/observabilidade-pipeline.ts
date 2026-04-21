import { logApiError, logApiInfo } from "@/lib/api-response";

export type ContextoAuditoriaPipeline = {
  requestId: string;
  usuarioId: string;
  perfilUsuario: string;
};

export function criarEntradaRefAuditavel(
  base: Record<string, unknown>,
  contexto: ContextoAuditoriaPipeline,
): Record<string, unknown> {
  return {
    ...base,
    requestId: contexto.requestId,
    usuarioId: contexto.usuarioId,
    perfilUsuario: contexto.perfilUsuario,
  };
}

export function registrarEventoPipeline(
  scope: string,
  requestId: string,
  evento: string,
  metadata?: Record<string, unknown>,
) {
  logApiInfo(scope, requestId, `evento:${evento}`, { evento, ...(metadata ?? {}) });
}

export function registrarFalhaPipeline(
  scope: string,
  requestId: string,
  evento: string,
  error: unknown,
  metadata?: Record<string, unknown>,
) {
  logApiError(scope, requestId, error, { evento, ...(metadata ?? {}) });
}
