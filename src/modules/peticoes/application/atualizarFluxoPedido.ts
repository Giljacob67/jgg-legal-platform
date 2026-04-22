import { services } from "@/services/container";
import type { EtapaPipeline, PedidoDePeca, StatusPedido } from "@/modules/peticoes/domain/types";

export async function atualizarFluxoPedido(
  pedidoId: string,
  input: { status: StatusPedido; etapaAtual: EtapaPipeline },
): Promise<PedidoDePeca | undefined> {
  return services.peticoesRepository.atualizarFluxoPedido(pedidoId, input);
}
