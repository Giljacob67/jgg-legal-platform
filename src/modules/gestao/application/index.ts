import { MockGestaoRepository } from "../infrastructure/mockGestaoRepository";
let _repo: MockGestaoRepository | null = null;
const getRepo = () => { if (!_repo) _repo = new MockGestaoRepository(); return _repo; };
export const obterKpis = () => getRepo().obterKpis();
export const listarAlcadas = () => getRepo().listarAlcadas();
export const listarAlertas = () => getRepo().listarAlertas();
