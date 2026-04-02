import type { NovoPedidoPayload } from "@/modules/peticoes/domain/types";

export function validarNovoPedidoPayload(payload: NovoPedidoPayload): void {
  if (!payload.casoId.trim()) {
    throw new Error("Informe um caso válido para criar o pedido.");
  }

  if (!payload.titulo.trim()) {
    throw new Error("Informe um título para o pedido.");
  }

  if (!payload.prazoFinal.trim()) {
    throw new Error("Informe um prazo final.");
  }
}
