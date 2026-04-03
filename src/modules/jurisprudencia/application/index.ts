import { MockJurisprudenciaRepository } from "../infrastructure/mockJurisprudenciaRepository";
import type { TipoDecisao, Jurisprudencia } from "../domain/types";

let _repo: MockJurisprudenciaRepository | null = null;
const getRepo = () => { if (!_repo) _repo = new MockJurisprudenciaRepository(); return _repo; };

export const listarJurisprudencias = (filtros?: { tribunal?: string; tipo?: TipoDecisao; materia?: string }) =>
  getRepo().listar(filtros);

export const pesquisarJurisprudencias = (query: string) =>
  getRepo().pesquisarPorTexto(query);

export const obterJurisprudenciaPorId = (id: string) =>
  getRepo().obterPorId(id);

export const criarJurisprudencia = (dados: Omit<Jurisprudencia, "id" | "criadoEm">) =>
  getRepo().criar(dados);
