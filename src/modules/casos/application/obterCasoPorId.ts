import { services } from "@/services/container";
import type { Caso } from "@/modules/casos/domain/types";

export async function obterCasoPorId(casoId: string): Promise<Caso | undefined> {
  return await services.casosRepository.obterCasoPorId(casoId);
}
