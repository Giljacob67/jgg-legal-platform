import "server-only";

import { getDataMode } from "@/lib/data-mode";
import type {
  ArquivoFisicoRepository,
  DocumentoJuridicoRepository,
  DocumentoVinculoRepository,
  FileHashService,
  FileStorageGateway,
  ProcessamentoEtapaRepository,
} from "@/modules/documentos/application/contracts";
import { createMockDocumentosInfra } from "@/modules/documentos/infrastructure/mockDocumentosInfra";
import { createRealDocumentosInfra } from "@/modules/documentos/infrastructure/real/realDocumentosInfra";

export interface DocumentosInfra {
  fileStorageGateway: FileStorageGateway;
  fileHashService: FileHashService;
  arquivoFisicoRepository: ArquivoFisicoRepository;
  documentoJuridicoRepository: DocumentoJuridicoRepository;
  documentoVinculoRepository: DocumentoVinculoRepository;
  processamentoEtapaRepository: ProcessamentoEtapaRepository;
}

let cachedInfra: DocumentosInfra | null = null;

export function getDocumentosInfra(): DocumentosInfra {
  if (cachedInfra) {
    return cachedInfra;
  }

  const mode = getDataMode();
  cachedInfra = mode === "real" ? createRealDocumentosInfra() : createMockDocumentosInfra();

  return cachedInfra;
}
