import "server-only";

import { getDataMode } from "@/lib/data-mode";
import { createMockDocumentosInfra } from "@/modules/documentos/infrastructure/mockDocumentosInfra";
import { createRealDocumentosInfra } from "@/modules/documentos/infrastructure/real/realDocumentosInfra";

export type DocumentosInfra = ReturnType<typeof createMockDocumentosInfra>;

let cachedInfra: DocumentosInfra | null = null;

export function getDocumentosInfra(): DocumentosInfra {
  if (cachedInfra) {
    return cachedInfra;
  }

  const mode = getDataMode();
  cachedInfra = mode === "real" ? createRealDocumentosInfra() : createMockDocumentosInfra();

  return cachedInfra;
}
