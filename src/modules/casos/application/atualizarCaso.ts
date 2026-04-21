import { services } from "@/services/container";
import type { Caso } from "@/modules/casos/domain/types";
import type { AtualizarCasoPayload } from "@/modules/casos/application/contracts";

export async function atualizarCaso(casoId: string, payload: AtualizarCasoPayload): Promise<Caso> {
  return await services.casosRepository.atualizarCaso(casoId, payload);
}
