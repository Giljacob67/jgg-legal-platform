import { services } from "@/services/container";
import type { Documento } from "@/modules/documentos/domain/types";

export function listarDocumentos(): Documento[] {
  return services.documentosRepository.listarDocumentos();
}
