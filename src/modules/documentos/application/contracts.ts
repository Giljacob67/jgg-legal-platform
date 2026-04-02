import type {
  ArquivoFisico,
  DocumentoJuridico,
  DocumentoVinculo,
  EtapaProcessamentoDocumental,
  ExecucaoEtapaProcessamento,
  StatusDocumento,
  StatusExecucaoEtapa,
  StatusProcessamentoDocumental,
  TipoDocumento,
} from "@/modules/documentos/domain/types";

export interface FileStorageGateway {
  upload(input: {
    filename: string;
    contentType: string;
    bytes: Buffer;
  }): Promise<{
    provider: "vercel_blob" | "mock";
    providerKey: string;
    url: string;
    sizeBytes: number;
  }>;
}

export interface FileHashService {
  sha256(bytes: Buffer): Promise<string | null>;
}

export interface ArquivoFisicoRepository {
  criar(input: Omit<ArquivoFisico, "id" | "criadoEm">): Promise<ArquivoFisico>;
  obterPorId(id: string): Promise<ArquivoFisico | null>;
}

export interface DocumentoJuridicoRepository {
  criar(input: {
    arquivoFisicoId: string;
    titulo: string;
    tipoDocumento: TipoDocumento;
    statusDocumento: StatusDocumento;
    metadados?: Record<string, unknown>;
  }): Promise<DocumentoJuridico>;
  listar(filtro?: { casoId?: string; pedidoId?: string }): Promise<DocumentoJuridico[]>;
  obterPorId(id: string): Promise<DocumentoJuridico | null>;
  atualizarConteudoProcessado(
    id: string,
    input: {
      textoExtraido?: string;
      textoNormalizado?: string;
      resumoJuridico?: string;
      statusDocumento?: StatusDocumento;
    },
  ): Promise<DocumentoJuridico>;
  atualizarStatusProcessamento(
    id: string,
    status: StatusProcessamentoDocumental,
  ): Promise<DocumentoJuridico>;
}

export interface DocumentoVinculoRepository {
  vincular(input: {
    documentoJuridicoId: string;
    tipoEntidade: "caso" | "pedido_peca";
    entidadeId: string;
    papel?: "principal" | "apoio";
  }): Promise<DocumentoVinculo>;
  listarPorEntidade(input: {
    tipoEntidade: "caso" | "pedido_peca";
    entidadeId: string;
  }): Promise<DocumentoVinculo[]>;
  listarPorDocumento(documentoJuridicoId: string): Promise<DocumentoVinculo[]>;
}

export interface ProcessamentoEtapaRepository {
  iniciarTentativa(input: {
    documentoJuridicoId: string;
    etapa: EtapaProcessamentoDocumental;
    entradaRef?: Record<string, unknown>;
  }): Promise<ExecucaoEtapaProcessamento>;
  concluirTentativa(input: {
    execucaoId: string;
    status: StatusExecucaoEtapa;
    saida?: Record<string, unknown>;
    codigoErro?: string;
    mensagemErro?: string;
  }): Promise<ExecucaoEtapaProcessamento>;
  listarPorDocumento(documentoJuridicoId: string): Promise<ExecucaoEtapaProcessamento[]>;
}
