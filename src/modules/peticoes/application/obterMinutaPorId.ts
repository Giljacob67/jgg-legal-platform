import { services } from "@/services/container";
import type { Minuta } from "@/modules/peticoes/domain/types";

export function obterMinutaPorId(minutaId: string): Minuta | undefined {
  return services.peticoesRepository.obterMinutaPorId(minutaId);
}
