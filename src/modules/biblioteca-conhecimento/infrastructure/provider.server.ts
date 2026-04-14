import "server-only";

import { getDataMode } from "@/lib/data-mode";
import { MockBibliotecaRepository, getBibliotecaRepo } from "./mockBibliotecaRepository";
import { RealBibliotecaRepository } from "./realBibliotecaRepository";

export type IBibliotecaRepository = MockBibliotecaRepository | RealBibliotecaRepository;

let _real: RealBibliotecaRepository | null = null;

/**
 * Retorna o repositório de biblioteca de conhecimento adequado ao DATA_MODE.
 *
 * - DATA_MODE=mock  → MockBibliotecaRepository (in-memory)
 * - DATA_MODE=real  → RealBibliotecaRepository (PostgreSQL via Neon)
 */
export function getBibliotecaRepository(): IBibliotecaRepository {
  if (getDataMode() === "real") {
    if (!_real) _real = new RealBibliotecaRepository();
    return _real;
  }
  return getBibliotecaRepo();
}
