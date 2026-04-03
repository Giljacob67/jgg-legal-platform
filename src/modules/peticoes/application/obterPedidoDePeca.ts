import { services } from "@/services/container";
import type { PedidoDePeca } from "@/modules/peticoes/domain/types";

export async function obterPedidoDePeca(pedidoId: string): Promise<PedidoDePeca | undefined> {
  return await services.peticoesRepository.obterPedidoPorId(pedidoId);
}
