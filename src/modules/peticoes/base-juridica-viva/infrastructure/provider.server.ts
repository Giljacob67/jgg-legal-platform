import "server-only";

import { getDataMode } from "@/lib/data-mode";
import { createMockBaseJuridicaVivaInfra } from "@/modules/peticoes/base-juridica-viva/infrastructure/mockBaseJuridicaVivaInfra";
import { createRealBaseJuridicaVivaInfra } from "@/modules/peticoes/base-juridica-viva/infrastructure/realBaseJuridicaVivaInfra";

export type BaseJuridicaVivaInfraProvider = ReturnType<typeof createMockBaseJuridicaVivaInfra>;

let cachedInfra: BaseJuridicaVivaInfraProvider | null = null;

export function getBaseJuridicaVivaInfra(): BaseJuridicaVivaInfraProvider {
  if (cachedInfra) {
    return cachedInfra;
  }

  const modo = getDataMode();
  cachedInfra = modo === "real" ? createRealBaseJuridicaVivaInfra() : createMockBaseJuridicaVivaInfra();
  return cachedInfra;
}
