export type TipoItemBiblioteca = "template" | "tese" | "checklist";

export interface ItemBibliotecaJuridica {
  id: string;
  tipo: TipoItemBiblioteca;
  titulo: string;
  materia: string;
  ultimaAtualizacao: string;
  resumo: string;
  tags: string[];
}
