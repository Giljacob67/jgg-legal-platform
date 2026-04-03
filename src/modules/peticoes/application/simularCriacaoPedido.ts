import { services } from "@/services/container";
import type { NovoPedidoPayload, PedidoDePeca } from "@/modules/peticoes/domain/types";
import { validarNovoPedidoPayload } from "@/modules/peticoes/domain/validarNovoPedidoPayload";

export async function simularCriacaoPedido(payload: NovoPedidoPayload): Promise<PedidoDePeca> {
  validarNovoPedidoPayload(payload);
  return await services.peticoesRepository.simularCriacaoPedido(payload);
}
