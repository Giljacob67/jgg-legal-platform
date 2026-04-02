import "server-only";

import { sincronizarPipelinePedido } from "@/modules/peticoes/application/operacional/sincronizarPipelinePedido";

export async function obterPipelineDoPedido(pedidoId: string) {
  return sincronizarPipelinePedido(pedidoId);
}
