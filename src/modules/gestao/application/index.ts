import { getDataMode } from "@/lib/data-mode";
import { MockGestaoRepository } from "../infrastructure/mockGestaoRepository";
import { PostgresGestaoRepository } from "../infrastructure/postgresGestaoRepository";

type GestaoRepository = MockGestaoRepository | PostgresGestaoRepository;

let _repo: GestaoRepository | null = null;

function getRepo(): GestaoRepository {
  if (!_repo) {
    _repo = getDataMode() === "real" ? new PostgresGestaoRepository() : new MockGestaoRepository();
  }
  return _repo;
}

export const obterKpis = () => getRepo().obterKpis();
export const listarAlcadas = () => getRepo().listarAlcadas();
export const listarAlertas = () => getRepo().listarAlertas();
