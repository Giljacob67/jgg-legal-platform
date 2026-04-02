import { services } from "@/services/container";
import type { Minuta } from "@/modules/peticoes/domain/types";

export function obterMinutaPorPedidoId(pedidoId: string): Minuta | undefined {
  return services.peticoesRepository.obterMinutaPorPedidoId(pedidoId);
}
