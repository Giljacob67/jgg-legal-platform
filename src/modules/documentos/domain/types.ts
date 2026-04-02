import type { DataMode } from "@/lib/data-mode";

export type { DataMode };

export type TipoDocumento =
  | "Contrato"
  | "Petição"
  | "Comprovante"
  | "Procuração"
  | "Parecer";

export type StatusDocumento = "pendente de leitura" | "lido" | "extraído";

export type StatusProcessamentoDocumental =
  | "nao_iniciado"
  | "enfileirado"
  | "em_processamento"
  | "processado_parcial"
  | "processado"
  | "erro";

export type EtapaProcessamentoDocumental = "leitura" | "classificacao" | "resumo" | "extracao_fatos";

export type StatusExecucaoEtapa = "pendente" | "em_andamento" | "sucesso" | "falha" | "parcial";

export interface ArquivoFisico {
  id: string;
  provider: "vercel_blob" | "mock";
  providerKey: string;
  url: string;
  nomeOriginal: string;
  mimeType: string;
  extensao?: string;
  tamanhoBytes: number;
  sha256?: string;
  checksumAlgoritmo: "sha256";
  criadoEm: string;
}

export interface DocumentoJuridico {
  id: string;
  arquivoFisicoId: string;
  titulo: string;
  tipoDocumento: TipoDocumento;
  statusDocumento: StatusDocumento;
  statusProcessamento: StatusProcessamentoDocumental;
  resumoJuridico?: string;
  metadados: Record<string, unknown>;
  criadoEm: string;
  atualizadoEm: string;
}

export interface DocumentoVinculo {
  id: string;
  documentoJuridicoId: string;
  tipoEntidade: "caso" | "pedido_peca";
  entidadeId: string;
  papel: "principal" | "apoio";
  criadoEm: string;
}

export interface ExecucaoEtapaProcessamento {
  id: string;
  documentoJuridicoId: string;
  etapa: EtapaProcessamentoDocumental;
  status: StatusExecucaoEtapa;
  tentativa: number;
  codigoErro?: string;
  mensagemErro?: string;
  entradaRef: Record<string, unknown>;
  saida: Record<string, unknown>;
  iniciadoEm?: string;
  finalizadoEm?: string;
  criadoEm: string;
}

export interface DocumentoComArquivoEVinculos {
  documento: DocumentoJuridico;
  arquivo: ArquivoFisico;
  vinculos: DocumentoVinculo[];
}

export interface DocumentoListItem {
  id: string;
  casoId?: string;
  pedidoId?: string;
  titulo: string;
  tipo: TipoDocumento;
  status: StatusDocumento;
  statusProcessamento: StatusProcessamentoDocumental;
  dataUpload: string;
  tamanhoMb: number;
  resumo: string;
  urlArquivo: string;
  sha256?: string;
}

export interface UploadDocumentoPayload {
  filename: string;
  contentType: string;
  bytes: Buffer;
  titulo: string;
  tipoDocumento: TipoDocumento;
  vinculos: Array<{
    tipoEntidade: "caso" | "pedido_peca";
    entidadeId: string;
    papel?: "principal" | "apoio";
  }>;
}
