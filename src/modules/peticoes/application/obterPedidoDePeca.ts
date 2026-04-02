import { services } from "@/services/container";
import type { PedidoDePeca } from "@/modules/peticoes/domain/types";

export function obterPedidoDePeca(pedidoId: string): PedidoDePeca | undefined {
  return services.peticoesRepository.obterPedidoPorId(pedidoId);
}
