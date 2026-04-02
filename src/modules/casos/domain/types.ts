export type StatusCaso =
  | "novo"
  | "em análise"
  | "estratégia"
  | "minuta em elaboração"
  | "revisão"
  | "protocolado";

export interface Parte {
  nome: string;
  papel: "autor" | "réu" | "terceiro";
}

export interface EventoCaso {
  id: string;
  data: string;
  descricao: string;
}

export interface Caso {
  id: string;
  titulo: string;
  cliente: string;
  materia: string;
  tribunal: string;
  status: StatusCaso;
  prazoFinal: string;
  resumo: string;
  partes: Parte[];
  documentosRelacionados: string[];
  eventos: EventoCaso[];
}
