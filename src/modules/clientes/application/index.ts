import { MockClientesRepository } from "../infrastructure/mockClientesRepository";
import type { NovoCLientePayload, StatusCliente, Cliente } from "../domain/types";

let _repo: MockClientesRepository | null = null;
const getRepo = () => { if (!_repo) _repo = new MockClientesRepository(); return _repo; };

export const listarClientes = (filtros?: { status?: StatusCliente }) => getRepo().listar(filtros);
export const obterClientePorId = (id: string) => getRepo().obterPorId(id);
export const criarCliente = (payload: NovoCLientePayload) => getRepo().criar(payload);
export const atualizarCliente = (id: string, dados: Partial<NovoCLientePayload>) => getRepo().atualizar(id, dados);
