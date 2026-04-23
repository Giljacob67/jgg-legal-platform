export type StatusModulo = "ativo" | "em implantação" | "planejado";

export type GrupoModulo = "producao" | "inteligencia" | "gestao" | "admin";

export const LABEL_GRUPO: Record<GrupoModulo, string> = {
  producao: "Produção Jurídica",
  inteligencia: "Inteligência",
  gestao: "Gestão",
  admin: "Administração",
};

export type ModuloId =
  | "dashboard"
  | "agenda"
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
  icone: string;           // emoji ou identificador de ícone
  grupo: GrupoModulo;      // agrupamento visual na sidebar
}
