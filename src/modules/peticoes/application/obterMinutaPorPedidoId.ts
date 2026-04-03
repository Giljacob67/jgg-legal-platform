import { services } from "@/services/container";
import type { Minuta } from "@/modules/peticoes/domain/types";

export async function obterMinutaPorPedidoId(pedidoId: string): Promise<Minuta | undefined> {
  return await services.peticoesRepository.obterMinutaPorPedidoId(pedidoId);
}
