import type { Cliente, NovoClientePayload, StatusCliente } from "@/modules/clientes/domain/types";

export interface ClientesRepository {
  listar(filtros?: { status?: StatusCliente }): Promise<Cliente[]>;
  obterPorId(id: string): Promise<Cliente | null>;
  criar(payload: NovoClientePayload): Promise<Cliente>;
  atualizar(id: string, dados: Partial<NovoClientePayload>): Promise<Cliente>;
}
