import { services } from "@/services/container";
import type { PedidoDePeca } from "@/modules/peticoes/domain/types";

export async function listarPedidosDePeca(): Promise<PedidoDePeca[]> {
  return await services.peticoesRepository.listarPedidos();
}
