import type { ContextoJuridicoPedido, EtapaPipeline, SnapshotPipelineEtapa } from "@/modules/peticoes/domain/types";
import type { MateriaCanonica, TipoPecaCanonica } from "@/modules/peticoes/domain/geracao-minuta";

export interface PipelineSnapshotRepository {
  listarPorPedido(pedidoId: string): Promise<SnapshotPipelineEtapa[]>;
  obterUltimoPorEtapa(pedidoId: string, etapa: EtapaPipeline): Promise<SnapshotPipelineEtapa | null>;
  salvarNovaVersao(input: {
    pedidoId: string;
    etapa: EtapaPipeline;
    entradaRef: Record<string, unknown>;
    saidaEstruturada: Record<string, unknown>;
    status: SnapshotPipelineEtapa["status"];
    executadoEm?: string;
    codigoErro?: string;
    mensagemErro?: string;
    tentativa: number;
  }): Promise<SnapshotPipelineEtapa>;
}

export interface ContextoJuridicoPedidoRepository {
  listarVersoes(pedidoId: string): Promise<ContextoJuridicoPedido[]>;
  obterUltimaVersao(pedidoId: string): Promise<ContextoJuridicoPedido | null>;
  salvarNovaVersao(input: Omit<ContextoJuridicoPedido, "id" | "criadoEm">): Promise<ContextoJuridicoPedido>;
}

export interface MinutaRastroContextoRepository {
  upsertVinculo(input: {
    minutaId: string;
    versaoId: string;
    pedidoId: string;
    numeroVersao: number;
    contextoVersao: number;
    templateId?: string;
    templateNome?: string;
    templateVersao?: number;
    tipoPecaCanonica?: TipoPecaCanonica;
    materiaCanonica?: MateriaCanonica;
    referenciasDocumentais?: string[];
  }): Promise<void>;
  listarPorMinuta(minutaId: string): Promise<
    Array<{
      versaoId: string;
      contextoVersao: number;
      templateId?: string;
      templateNome?: string;
      templateVersao?: number;
      tipoPecaCanonica?: TipoPecaCanonica;
      materiaCanonica?: MateriaCanonica;
      referenciasDocumentais: string[];
    }>
  >;
}
