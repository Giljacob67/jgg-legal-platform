import { services } from "@/services/container";
import type { Caso } from "@/modules/casos/domain/types";
import type { NovoCasoPayload } from "@/modules/casos/infrastructure/mockCasosRepository";

export async function criarCaso(payload: NovoCasoPayload): Promise<Caso> {
  return await services.casosRepository.criarCaso(payload);
}
