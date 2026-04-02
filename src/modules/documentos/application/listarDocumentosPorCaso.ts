import { services } from "@/services/container";
import type { Documento } from "@/modules/documentos/domain/types";

export function listarDocumentosPorCaso(casoId: string): Documento[] {
  return services.documentosRepository.listarPorCaso(casoId);
}
