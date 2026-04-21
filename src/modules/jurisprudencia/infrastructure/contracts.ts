import type { Jurisprudencia, TipoDecisao } from "@/modules/jurisprudencia/domain/types";

export interface JurisprudenciaRepository {
  listar(filtros?: { tribunal?: string; tipo?: TipoDecisao; materia?: string }): Promise<Jurisprudencia[]>;
  pesquisarPorTexto(query: string): Promise<Jurisprudencia[]>;
  obterPorId(id: string): Promise<Jurisprudencia | null>;
  criar(dados: Omit<Jurisprudencia, "id" | "criadoEm">): Promise<Jurisprudencia>;
  salvarEmbedding(id: string, embedding: number[]): Promise<void>;
  listarPendentesIndexacao(limite?: number): Promise<Jurisprudencia[]>;
  buscaSemantica(embedding: number[], limite?: number): Promise<Jurisprudencia[]>;
}
