import { services } from "@/services/container";
import type { AtualizarContratoPayload } from "@/modules/contratos/domain/types";

export const atualizarContrato = (id: string, payload: AtualizarContratoPayload) =>
  services.contratosRepository.atualizarContrato(id, payload);