import { services } from "@/services/container";
import type { TipoDecisao, Jurisprudencia } from "@/modules/jurisprudencia/domain/types";

export const listarJurisprudencias = (filtros?: { tribunal?: string; tipo?: TipoDecisao; materia?: string }) =>
  services.jurisprudenciaRepository.listar(filtros);

export const pesquisarJurisprudencias = (query: string) =>
  services.jurisprudenciaRepository.pesquisarPorTexto(query);

export const obterJurisprudenciaPorId = (id: string) =>
  services.jurisprudenciaRepository.obterPorId(id);

export const criarJurisprudencia = (dados: Omit<Jurisprudencia, "id" | "criadoEm">) =>
  services.jurisprudenciaRepository.criar(dados);

export const salvarEmbeddingJurisprudencia = (id: string, embedding: number[]) =>
  services.jurisprudenciaRepository.salvarEmbedding(id, embedding);

export const listarPendentesIndexacao = (limite?: number) =>
  services.jurisprudenciaRepository.listarPendentesIndexacao(limite);

export const buscaSemanticaJurisprudencia = (embedding: number[], limite?: number) =>
  services.jurisprudenciaRepository.buscaSemantica(embedding, limite);
