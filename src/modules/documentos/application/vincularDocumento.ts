import "server-only";

import type { DocumentoVinculo } from "@/modules/documentos/domain/types";
import { getDocumentosInfra } from "@/modules/documentos/infrastructure/provider.server";

export async function vincularDocumento(input: {
  documentoId: string;
  tipoEntidade: "caso" | "pedido_peca";
  entidadeId: string;
  papel?: "principal" | "apoio";
}): Promise<DocumentoVinculo> {
  const infra = getDocumentosInfra();

  return infra.documentoVinculoRepository.vincular({
    documentoJuridicoId: input.documentoId,
    tipoEntidade: input.tipoEntidade,
    entidadeId: input.entidadeId,
    papel: input.papel,
  });
}
