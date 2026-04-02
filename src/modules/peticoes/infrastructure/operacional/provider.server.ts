import "server-only";

import { getDataMode } from "@/lib/data-mode";
import { createMockPeticoesOperacionalInfra } from "@/modules/peticoes/infrastructure/operacional/mockPeticoesOperacionalInfra";
import { createRealPeticoesOperacionalInfra } from "@/modules/peticoes/infrastructure/operacional/realPeticoesOperacionalInfra";

export type PeticoesOperacionalInfra = ReturnType<typeof createMockPeticoesOperacionalInfra>;

let cachedInfra: PeticoesOperacionalInfra | null = null;

export function getPeticoesOperacionalInfra(): PeticoesOperacionalInfra {
  if (cachedInfra) {
    return cachedInfra;
  }

  const modo = getDataMode();
  cachedInfra = modo === "real" ? createRealPeticoesOperacionalInfra() : createMockPeticoesOperacionalInfra();

  return cachedInfra;
}
