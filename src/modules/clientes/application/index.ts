import { MockClientesRepository } from "../infrastructure/mockClientesRepository";
import type { NovoClientePayload, StatusCliente, Cliente } from "../domain/types";

let _repo: MockClientesRepository | null = null;
const getRepo = () => { if (!_repo) _repo = new MockClientesRepository(); return _repo; };

export const listarClientes = (filtros?: { status?: StatusCliente }) => getRepo().listar(filtros);
export const obterClientePorId = (id: string) => getRepo().obterPorId(id);
export const criarCliente = (payload: NovoClientePayload) => getRepo().criar(payload);
export const atualizarCliente = (id: string, dados: Partial<NovoClientePayload>) => getRepo().atualizar(id, dados);
