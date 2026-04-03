import { NovoPedidoPayloadSchema } from "@/lib/validation";
import type { NovoPedidoPayload } from "@/modules/peticoes/domain/types";

/**
 * Validates a NovoPedidoPayload using the centralized Zod schema.
 * Throws on validation failure for backward compatibility with existing callers.
 */
export function validarNovoPedidoPayload(payload: NovoPedidoPayload): void {
  const result = NovoPedidoPayloadSchema.safeParse(payload);

  if (!result.success) {
    const firstError = result.error.issues[0]?.message ?? "Dados inválidos.";
    throw new Error(firstError);
  }
}

/**
 * Safe version that returns errors instead of throwing.
 */
export function validarNovoPedidoSafe(
  payload: unknown,
): { success: true; data: NovoPedidoPayload } | { success: false; errors: string[] } {
  const result = NovoPedidoPayloadSchema.safeParse(payload);

  if (result.success) {
    return { success: true, data: result.data as NovoPedidoPayload };
  }

  return {
    success: false,
    errors: result.error.issues.map((issue) => issue.message),
  };
}
