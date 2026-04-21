import type {
  AnaliseRiscoContrato,
  AtualizarContratoPayload,
  Clausula,
  Contrato,
  NovoContratoPayload,
  StatusContrato,
} from "@/modules/contratos/domain/types";

export interface ContratosRepository {
  listar(filtros?: { status?: StatusContrato; tipo?: Contrato["tipo"] }): Promise<Contrato[]>;
  obterPorId(id: string): Promise<Contrato | null>;
  criar(payload: NovoContratoPayload): Promise<Contrato>;
  atualizarStatus(id: string, status: StatusContrato): Promise<Contrato>;
  salvarAnaliseRisco(id: string, analise: AnaliseRiscoContrato | undefined): Promise<void>;
  atualizarConteudoEClausulas(id: string, clausulas: Clausula[], conteudoAtual: string): Promise<Contrato>;
  atualizarContrato(id: string, payload: AtualizarContratoPayload): Promise<Contrato>;
  excluirContrato(id: string): Promise<void>;
}
