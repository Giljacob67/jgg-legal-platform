import type {
  ArquivoFisicoRepository,
  DocumentoJuridicoRepository,
  DocumentoVinculoRepository,
  ProcessamentoEtapaRepository,
} from "@/modules/documentos/application/contracts";
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
import { CryptoHashService } from "@/modules/documentos/infrastructure/hashService";
import { MockFileStorageGateway } from "@/modules/documentos/infrastructure/mockFileStorageGateway";

interface MockDocumentStore {
  arquivos: ArquivoFisico[];
  documentos: DocumentoJuridico[];
  vinculos: DocumentoVinculo[];
  processamentos: ExecucaoEtapaProcessamento[];
}

const STORE_KEY = "__jgg_mock_document_store__";

function criarSeedStore(): MockDocumentStore {
  const arquivos: ArquivoFisico[] = [
    {
      id: "ARQ-001",
      provider: "mock",
      providerKey: "mock/ARQ-001-contrato-principal.pdf",
      url: "mock://storage/mock/ARQ-001-contrato-principal.pdf",
      nomeOriginal: "contrato-principal.pdf",
      mimeType: "application/pdf",
      extensao: "pdf",
      tamanhoBytes: 3355443,
      sha256: undefined,
      checksumAlgoritmo: "sha256",
      criadoEm: "2026-03-29T11:20:00-03:00",
    },
    {
      id: "ARQ-002",
      provider: "mock",
      providerKey: "mock/ARQ-002-notificacao.pdf",
      url: "mock://storage/mock/ARQ-002-notificacao.pdf",
      nomeOriginal: "notificacao.pdf",
      mimeType: "application/pdf",
      extensao: "pdf",
      tamanhoBytes: 1153433,
      sha256: undefined,
      checksumAlgoritmo: "sha256",
      criadoEm: "2026-03-30T09:50:00-03:00",
    },
    {
      id: "ARQ-003",
      provider: "mock",
      providerKey: "mock/ARQ-003-minuta-inicial.docx",
      url: "mock://storage/mock/ARQ-003-minuta-inicial.docx",
      nomeOriginal: "minuta-inicial.docx",
      mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      extensao: "docx",
      tamanhoBytes: 838860,
      sha256: undefined,
      checksumAlgoritmo: "sha256",
      criadoEm: "2026-04-01T15:05:00-03:00",
    },
  ];

  const documentos: DocumentoJuridico[] = [
    {
      id: "DOC-001",
      arquivoFisicoId: "ARQ-001",
      titulo: "Contrato principal de fornecimento",
      tipoDocumento: "Contrato",
      statusDocumento: "lido",
      statusProcessamento: "processado",
      resumoJuridico: "Instrumento com cláusulas de penalidade e prazo de entrega.",
      metadados: {},
      criadoEm: "2026-03-29T11:20:00-03:00",
      atualizadoEm: "2026-03-29T11:20:00-03:00",
    },
    {
      id: "DOC-002",
      arquivoFisicoId: "ARQ-002",
      titulo: "Notificação extrajudicial enviada",
      tipoDocumento: "Comprovante",
      statusDocumento: "extraído",
      statusProcessamento: "processado",
      resumoJuridico: "Comprovante de recebimento e prazo para resposta.",
      metadados: {},
      criadoEm: "2026-03-30T09:50:00-03:00",
      atualizadoEm: "2026-03-30T09:50:00-03:00",
    },
    {
      id: "DOC-003",
      arquivoFisicoId: "ARQ-003",
      titulo: "Minuta inicial da petição",
      tipoDocumento: "Petição",
      statusDocumento: "pendente de leitura",
      statusProcessamento: "nao_iniciado",
      resumoJuridico: "Versão preliminar para alinhamento de estratégia.",
      metadados: {},
      criadoEm: "2026-04-01T15:05:00-03:00",
      atualizadoEm: "2026-04-01T15:05:00-03:00",
    },
  ];

  const vinculos: DocumentoVinculo[] = [
    {
      id: "VIN-001",
      documentoJuridicoId: "DOC-001",
      tipoEntidade: "caso",
      entidadeId: "CAS-2026-001",
      papel: "principal",
      criadoEm: "2026-03-29T11:20:00-03:00",
    },
    {
      id: "VIN-002",
      documentoJuridicoId: "DOC-002",
      tipoEntidade: "caso",
      entidadeId: "CAS-2026-001",
      papel: "principal",
      criadoEm: "2026-03-30T09:50:00-03:00",
    },
    {
      id: "VIN-003",
      documentoJuridicoId: "DOC-003",
      tipoEntidade: "caso",
      entidadeId: "CAS-2026-001",
      papel: "apoio",
      criadoEm: "2026-04-01T15:05:00-03:00",
    },
    {
      id: "VIN-004",
      documentoJuridicoId: "DOC-003",
      tipoEntidade: "pedido_peca",
      entidadeId: "PED-2026-001",
      papel: "apoio",
      criadoEm: "2026-04-01T15:05:00-03:00",
    },
  ];

  return {
    arquivos,
    documentos,
    vinculos,
    processamentos: [],
  };
}

function getStore(): MockDocumentStore {
  const globalStore = globalThis as typeof globalThis & { [STORE_KEY]?: MockDocumentStore };

  if (!globalStore[STORE_KEY]) {
    globalStore[STORE_KEY] = criarSeedStore();
  }

  return globalStore[STORE_KEY];
}

function gerarId(prefixo: string): string {
  return `${prefixo}-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
}

class MockArquivoFisicoRepository implements ArquivoFisicoRepository {
  async criar(input: Omit<ArquivoFisico, "id" | "criadoEm">): Promise<ArquivoFisico> {
    const store = getStore();
    const arquivo: ArquivoFisico = {
      ...input,
      id: gerarId("ARQ"),
      criadoEm: new Date().toISOString(),
    };

    store.arquivos.unshift(arquivo);
    return arquivo;
  }

  async obterPorId(id: string): Promise<ArquivoFisico | null> {
    const store = getStore();
    return store.arquivos.find((item) => item.id === id) ?? null;
  }
}

class MockDocumentoJuridicoRepository implements DocumentoJuridicoRepository {
  async criar(input: {
    arquivoFisicoId: string;
    titulo: string;
    tipoDocumento: TipoDocumento;
    statusDocumento: StatusDocumento;
    metadados?: Record<string, unknown>;
  }): Promise<DocumentoJuridico> {
    const store = getStore();
    const agora = new Date().toISOString();

    const documento: DocumentoJuridico = {
      id: gerarId("DOC"),
      arquivoFisicoId: input.arquivoFisicoId,
      titulo: input.titulo,
      tipoDocumento: input.tipoDocumento,
      statusDocumento: input.statusDocumento,
      statusProcessamento: "nao_iniciado",
      resumoJuridico: undefined,
      metadados: input.metadados ?? {},
      criadoEm: agora,
      atualizadoEm: agora,
    };

    store.documentos.unshift(documento);
    return documento;
  }

  async listar(filtro?: { casoId?: string; pedidoId?: string }): Promise<DocumentoJuridico[]> {
    const store = getStore();

    if (!filtro?.casoId && !filtro?.pedidoId) {
      return store.documentos;
    }

    return store.documentos.filter((documento) => {
      const vinculos = store.vinculos.filter((item) => item.documentoJuridicoId === documento.id);

      if (filtro.casoId) {
        const matchCaso = vinculos.some(
          (item) => item.tipoEntidade === "caso" && item.entidadeId === filtro.casoId,
        );
        if (!matchCaso) {
          return false;
        }
      }

      if (filtro.pedidoId) {
        const matchPedido = vinculos.some(
          (item) => item.tipoEntidade === "pedido_peca" && item.entidadeId === filtro.pedidoId,
        );
        if (!matchPedido) {
          return false;
        }
      }

      return true;
    });
  }

  async obterPorId(id: string): Promise<DocumentoJuridico | null> {
    const store = getStore();
    return store.documentos.find((item) => item.id === id) ?? null;
  }

  async atualizarStatusProcessamento(
    id: string,
    status: StatusProcessamentoDocumental,
  ): Promise<DocumentoJuridico> {
    const store = getStore();
    const documento = store.documentos.find((item) => item.id === id);

    if (!documento) {
      throw new Error("Documento não encontrado para atualização de processamento.");
    }

    documento.statusProcessamento = status;
    documento.atualizadoEm = new Date().toISOString();

    return documento;
  }
}

class MockDocumentoVinculoRepository implements DocumentoVinculoRepository {
  async vincular(input: {
    documentoJuridicoId: string;
    tipoEntidade: "caso" | "pedido_peca";
    entidadeId: string;
    papel?: "principal" | "apoio";
  }): Promise<DocumentoVinculo> {
    const store = getStore();

    const existente = store.vinculos.find(
      (item) =>
        item.documentoJuridicoId === input.documentoJuridicoId &&
        item.tipoEntidade === input.tipoEntidade &&
        item.entidadeId === input.entidadeId,
    );

    if (existente) {
      return existente;
    }

    const vinculo: DocumentoVinculo = {
      id: gerarId("VIN"),
      documentoJuridicoId: input.documentoJuridicoId,
      tipoEntidade: input.tipoEntidade,
      entidadeId: input.entidadeId,
      papel: input.papel ?? "principal",
      criadoEm: new Date().toISOString(),
    };

    store.vinculos.push(vinculo);
    return vinculo;
  }

  async listarPorEntidade(input: {
    tipoEntidade: "caso" | "pedido_peca";
    entidadeId: string;
  }): Promise<DocumentoVinculo[]> {
    const store = getStore();

    return store.vinculos.filter(
      (item) => item.tipoEntidade === input.tipoEntidade && item.entidadeId === input.entidadeId,
    );
  }

  async listarPorDocumento(documentoJuridicoId: string): Promise<DocumentoVinculo[]> {
    const store = getStore();
    return store.vinculos.filter((item) => item.documentoJuridicoId === documentoJuridicoId);
  }
}

class MockProcessamentoEtapaRepository implements ProcessamentoEtapaRepository {
  async iniciarTentativa(input: {
    documentoJuridicoId: string;
    etapa: EtapaProcessamentoDocumental;
    entradaRef?: Record<string, unknown>;
  }): Promise<ExecucaoEtapaProcessamento> {
    const store = getStore();
    const tentativasDaEtapa = store.processamentos.filter(
      (item) => item.documentoJuridicoId === input.documentoJuridicoId && item.etapa === input.etapa,
    );

    const execucao: ExecucaoEtapaProcessamento = {
      id: gerarId("ETP"),
      documentoJuridicoId: input.documentoJuridicoId,
      etapa: input.etapa,
      status: "em_andamento",
      tentativa: tentativasDaEtapa.length + 1,
      entradaRef: input.entradaRef ?? {},
      saida: {},
      iniciadoEm: new Date().toISOString(),
      criadoEm: new Date().toISOString(),
    };

    store.processamentos.push(execucao);
    return execucao;
  }

  async concluirTentativa(input: {
    execucaoId: string;
    status: StatusExecucaoEtapa;
    saida?: Record<string, unknown>;
    codigoErro?: string;
    mensagemErro?: string;
  }): Promise<ExecucaoEtapaProcessamento> {
    const store = getStore();
    const execucao = store.processamentos.find((item) => item.id === input.execucaoId);

    if (!execucao) {
      throw new Error("Execução de etapa não encontrada.");
    }

    execucao.status = input.status;
    execucao.saida = input.saida ?? {};
    execucao.codigoErro = input.codigoErro;
    execucao.mensagemErro = input.mensagemErro;
    execucao.finalizadoEm = new Date().toISOString();

    return execucao;
  }

  async listarPorDocumento(documentoJuridicoId: string): Promise<ExecucaoEtapaProcessamento[]> {
    const store = getStore();
    return store.processamentos.filter((item) => item.documentoJuridicoId === documentoJuridicoId);
  }
}

export function createMockDocumentosInfra() {
  return {
    fileStorageGateway: new MockFileStorageGateway(),
    fileHashService: new CryptoHashService(),
    arquivoFisicoRepository: new MockArquivoFisicoRepository(),
    documentoJuridicoRepository: new MockDocumentoJuridicoRepository(),
    documentoVinculoRepository: new MockDocumentoVinculoRepository(),
    processamentoEtapaRepository: new MockProcessamentoEtapaRepository(),
  };
}
