import type { Caso, StatusCaso } from "@/modules/casos/domain/types";

export type ParteCasoPayload = { nome: string; papel: "autor" | "réu" | "terceiro" };

export type NovoCasoPayload = {
  titulo: string;
  cliente: string;
  materia: string;
  tribunal?: string;
  prazoFinal?: string;
  resumo?: string;
  partes?: ParteCasoPayload[];
};

export type AtualizarCasoPayload = {
  titulo?: string;
  cliente?: string;
  materia?: string;
  tribunal?: string;
  prazoFinal?: string;
  resumo?: string;
  status?: StatusCaso;
  partes?: ParteCasoPayload[];
};

export interface CasosRepository {
  listarCasos(): Promise<Caso[]>;
  obterCasoPorId(casoId: string): Promise<Caso | undefined>;
  criarCaso(payload: NovoCasoPayload): Promise<Caso>;
  atualizarCaso(casoId: string, payload: AtualizarCasoPayload): Promise<Caso>;
  excluirCaso(casoId: string): Promise<void>;
}
