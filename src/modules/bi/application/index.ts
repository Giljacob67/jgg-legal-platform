import { MockBIRepository } from "../infrastructure/mockBIRepository";
let _repo: MockBIRepository | null = null;
const getRepo = () => { if (!_repo) _repo = new MockBIRepository(); return _repo; };
export const obterMetricasFinanceiras = () => getRepo().obterFinanceiro();
export const obterMetricasJuridicas = () => getRepo().obterJuridico();
export const obterInsightsIA = () => getRepo().obterInsights();
