import "server-only";

import type { DocumentoListItem } from "@/modules/documentos/domain/types";
import { listarDocumentos } from "@/modules/documentos/application/listarDocumentos";

export async function listarDocumentosPorPedido(pedidoId: string): Promise<DocumentoListItem[]> {
  return listarDocumentos({ pedidoId });
}
