import { services } from "@/services/container";
import type { Caso } from "@/modules/casos/domain/types";

export function listarCasos(): Caso[] {
  return services.casosRepository.listarCasos();
}
