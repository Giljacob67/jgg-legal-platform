import "server-only";

import { createMockInteligenciaJuridicaInfra } from "@/modules/peticoes/inteligencia-juridica/infrastructure/mockInteligenciaJuridicaInfra";

export function createRealInteligenciaJuridicaInfra() {
  return createMockInteligenciaJuridicaInfra();
}
