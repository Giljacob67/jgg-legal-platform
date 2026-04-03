import { services } from "@/services/container";
import type { Minuta } from "@/modules/peticoes/domain/types";

export async function obterMinutaPorId(minutaId: string): Promise<Minuta | undefined> {
  return await services.peticoesRepository.obterMinutaPorId(minutaId);
}
