import { services } from "@/services/container";
import type { Caso } from "@/modules/casos/domain/types";

export async function listarCasos(): Promise<Caso[]> {
  return await services.casosRepository.listarCasos();
}
