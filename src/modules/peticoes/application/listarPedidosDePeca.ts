import { services } from "@/services/container";
import type { PedidoDePeca } from "@/modules/peticoes/domain/types";

export function listarPedidosDePeca(): PedidoDePeca[] {
  return services.peticoesRepository.listarPedidos();
}
