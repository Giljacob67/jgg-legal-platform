import { MockContratosRepository } from "../infrastructure/mockContratosRepository";
import type { NovoContratoPayload, StatusContrato, Contrato } from "../domain/types";

let _repo: MockContratosRepository | null = null;
function getRepo() {
  if (!_repo) _repo = new MockContratosRepository();
  return _repo;
}

export const listarContratos = (filtros?: { status?: StatusContrato; tipo?: Contrato["tipo"] }) =>
  getRepo().listar(filtros);

export const obterContratoPorId = (id: string) => getRepo().obterPorId(id);

export const criarContrato = (payload: NovoContratoPayload) => getRepo().criar(payload);

export const atualizarStatusContrato = (id: string, status: StatusContrato) =>
  getRepo().atualizarStatus(id, status);

export const salvarAnaliseRisco = (id: string, analise: Contrato["analiseRisco"]) =>
  getRepo().salvarAnaliseRisco(id, analise);
