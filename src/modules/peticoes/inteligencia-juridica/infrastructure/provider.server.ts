import "server-only";

import { getDataMode } from "@/lib/data-mode";
import { createMockInteligenciaJuridicaInfra } from "@/modules/peticoes/inteligencia-juridica/infrastructure/mockInteligenciaJuridicaInfra";
import { createRealInteligenciaJuridicaInfra } from "@/modules/peticoes/inteligencia-juridica/infrastructure/realInteligenciaJuridicaInfra";

export type InteligenciaJuridicaInfraProvider = ReturnType<typeof createMockInteligenciaJuridicaInfra>;

let cachedInfra: InteligenciaJuridicaInfraProvider | null = null;

export function getInteligenciaJuridicaInfra(): InteligenciaJuridicaInfraProvider {
  if (cachedInfra) {
    return cachedInfra;
  }

  const modo = getDataMode();
  cachedInfra = modo === "real" ? createRealInteligenciaJuridicaInfra() : createMockInteligenciaJuridicaInfra();
  return cachedInfra;
}
