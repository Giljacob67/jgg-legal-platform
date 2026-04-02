import { services } from "@/services/container";
import type { Caso } from "@/modules/casos/domain/types";

export function obterCasoPorId(casoId: string): Caso | undefined {
  return services.casosRepository.obterCasoPorId(casoId);
}
