export type StatusModulo = "ativo" | "em implantação" | "planejado";

export type ModuloId =
  | "dashboard"
  | "peticoes"
  | "casos"
  | "documentos"
  | "biblioteca-juridica"
  | "contratos"
  | "jurisprudencia"
  | "gestao"
  | "clientes"
  | "bi"
  | "administracao";

export interface ModuloNavegacao {
  id: ModuloId;
  nome: string;
  rota: string;
  status: StatusModulo;
  resumo: string;
}
