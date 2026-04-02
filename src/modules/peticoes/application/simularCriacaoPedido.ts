import { services } from "@/services/container";
import type { NovoPedidoPayload, PedidoDePeca } from "@/modules/peticoes/domain/types";
import { validarNovoPedidoPayload } from "@/modules/peticoes/domain/validarNovoPedidoPayload";

export function simularCriacaoPedido(payload: NovoPedidoPayload): PedidoDePeca {
  validarNovoPedidoPayload(payload);
  return services.peticoesRepository.simularCriacaoPedido(payload);
}
