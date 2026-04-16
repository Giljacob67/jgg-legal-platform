import { services } from "@/services/container";

export async function excluirCaso(casoId: string): Promise<void> {
  await services.casosRepository.excluirCaso(casoId);
}