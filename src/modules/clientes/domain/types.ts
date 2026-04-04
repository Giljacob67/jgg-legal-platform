// ─────────────────────────────────────────────────────────────
// MÓDULO CLIENTES — Domain Types
// ─────────────────────────────────────────────────────────────

export type TipoCliente = "pessoa_fisica" | "pessoa_juridica";
export type StatusCliente = "ativo" | "inativo" | "prospecto" | "encerrado";

export const LABEL_STATUS_CLIENTE: Record<StatusCliente, string> = {
  ativo: "Ativo",
  inativo: "Inativo",
  prospecto: "Prospecto",
  encerrado: "Encerrado",
};

export const STATUS_CLIENTE_COR: Record<StatusCliente, string> = {
  ativo: "bg-emerald-100 text-emerald-800 border-emerald-200",
  inativo: "bg-gray-100 text-gray-500 border-gray-200",
  prospecto: "bg-blue-100 text-blue-800 border-blue-200",
  encerrado: "bg-rose-100 text-rose-600 border-rose-200",
};

export interface Endereco {
  logradouro?: string;
  numero?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
}

export interface Cliente {
  id: string;
  nome: string;
  tipo: TipoCliente;
  cpfCnpj?: string;
  email?: string;
  telefone?: string;
  endereco?: Endereco;
  status: StatusCliente;
  responsavelId?: string;
  responsavelNome?: string;
  casosIds: string[];
  contratosIds: string[];
  anotacoes?: string;
  criadoEm: string;
  atualizadoEm: string;
}

export interface NovoClientePayload {
  nome: string;
  tipo: TipoCliente;
  cpfCnpj?: string;
  email?: string;
  telefone?: string;
  endereco?: Endereco;
  status?: StatusCliente;
  responsavelId?: string;
  anotacoes?: string;
}
