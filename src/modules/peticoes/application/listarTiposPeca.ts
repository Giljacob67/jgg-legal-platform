import { services } from "@/services/container";
import type { TipoPeca } from "@/modules/peticoes/domain/types";

export async function listarTiposPeca(): Promise<TipoPeca[]> {
  return await services.peticoesRepository.listarTiposPeca();
}
