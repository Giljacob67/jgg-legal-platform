import { services } from "@/services/container";
import type { TipoPeca } from "@/modules/peticoes/domain/types";

export function listarTiposPeca(): TipoPeca[] {
  return services.peticoesRepository.listarTiposPeca();
}
