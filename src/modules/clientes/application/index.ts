import { services } from "@/services/container";
import type { NovoClientePayload, StatusCliente } from "@/modules/clientes/domain/types";

export const listarClientes = (filtros?: { status?: StatusCliente; responsavelId?: string }) =>
  services.clientesRepository.listar(filtros);

export const obterClientePorId = (id: string) =>
  services.clientesRepository.obterPorId(id);

export const criarCliente = (payload: NovoClientePayload) =>
  services.clientesRepository.criar(payload);

export const atualizarCliente = (id: string, dados: Partial<NovoClientePayload>) =>
  services.clientesRepository.atualizar(id, dados);
