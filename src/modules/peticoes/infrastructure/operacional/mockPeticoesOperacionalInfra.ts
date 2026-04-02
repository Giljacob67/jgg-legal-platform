import type {
  ContextoJuridicoPedidoRepository,
  MinutaRastroContextoRepository,
  PipelineSnapshotRepository,
} from "@/modules/peticoes/application/operacional/contracts";
import type { ContextoJuridicoPedido, EtapaPipeline, SnapshotPipelineEtapa } from "@/modules/peticoes/domain/types";

interface MockPeticoesOperacionalStore {
  snapshots: SnapshotPipelineEtapa[];
  contextos: ContextoJuridicoPedido[];
  rastros: Array<{
    minutaId: string;
    versaoId: string;
    pedidoId: string;
    numeroVersao: number;
    contextoVersao: number;
  }>;
}

const STORE_KEY = "__jgg_mock_peticoes_operacional_store__";

function gerarId(prefixo: string): string {
  return `${prefixo}-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
}

function criarSeed(): MockPeticoesOperacionalStore {
  return {
    snapshots: [
      {
        id: "SNP-001",
        pedidoId: "PED-2026-001",
        etapa: "classificacao",
        versao: 1,
        entradaRef: { pedidoId: "PED-2026-001", documentos: 3 },
        saidaEstruturada: { classePrincipal: "contencioso contratual", confianca: 0.84 },
        status: "concluido",
        executadoEm: "2026-04-01T09:20:00-03:00",
        tentativa: 1,
      },
      {
        id: "SNP-002",
        pedidoId: "PED-2026-001",
        etapa: "leitura_documental",
        versao: 1,
        entradaRef: { pedidoId: "PED-2026-001", documentos: 3 },
        saidaEstruturada: { documentosLidos: 2, totalDocumentos: 3 },
        status: "concluido",
        executadoEm: "2026-04-01T10:10:00-03:00",
        tentativa: 1,
      },
      {
        id: "SNP-003",
        pedidoId: "PED-2026-001",
        etapa: "extracao_de_fatos",
        versao: 1,
        entradaRef: { pedidoId: "PED-2026-001" },
        saidaEstruturada: { fatosRelevantes: ["Inadimplemento contratual com multa diária prevista."] },
        status: "concluido",
        executadoEm: "2026-04-01T14:00:00-03:00",
        tentativa: 1,
      },
      {
        id: "SNP-004",
        pedidoId: "PED-2026-001",
        etapa: "analise_adversa",
        versao: 1,
        entradaRef: { origem: "mock_controlado" },
        saidaEstruturada: { observacao: "Etapa mantida em modo controlado no MVP." },
        status: "mock_controlado",
        executadoEm: "2026-04-01T14:05:00-03:00",
        tentativa: 1,
      },
    ],
    contextos: [
      {
        id: "CTX-001",
        pedidoId: "PED-2026-001",
        versaoContexto: 1,
        fatosRelevantes: [
          "Contrato principal previa multa diária por atraso de entrega.",
          "Notificação extrajudicial foi recebida sem resposta no prazo.",
        ],
        cronologia: [
          { data: "12/05/2024", descricao: "Celebração do contrato principal.", documentoId: "DOC-001" },
          { data: "25/03/2026", descricao: "Envio de notificação extrajudicial.", documentoId: "DOC-002" },
        ],
        pontosControvertidos: ["Caracterização do inadimplemento e extensão do dano emergente."],
        documentosChave: [
          { documentoId: "DOC-001", titulo: "Contrato principal de fornecimento", tipoDocumento: "Contrato" },
          { documentoId: "DOC-002", titulo: "Notificação extrajudicial enviada", tipoDocumento: "Comprovante" },
        ],
        referenciasDocumentais: [
          { documentoId: "DOC-001", titulo: "Contrato principal de fornecimento", tipoDocumento: "Contrato" },
          { documentoId: "DOC-002", titulo: "Notificação extrajudicial enviada", tipoDocumento: "Comprovante" },
        ],
        estrategiaSugerida:
          "Sustentar tutela de urgência com base no risco de dano contínuo e no inadimplemento já documentado.",
        fontesSnapshot: [
          { etapa: "classificacao", versao: 1 },
          { etapa: "leitura_documental", versao: 1 },
          { etapa: "extracao_de_fatos", versao: 1 },
        ],
        criadoEm: "2026-04-01T14:10:00-03:00",
      },
    ],
    rastros: [
      {
        minutaId: "MIN-2026-001",
        versaoId: "VER-001",
        pedidoId: "PED-2026-001",
        numeroVersao: 1,
        contextoVersao: 1,
      },
      {
        minutaId: "MIN-2026-001",
        versaoId: "VER-002",
        pedidoId: "PED-2026-001",
        numeroVersao: 2,
        contextoVersao: 1,
      },
    ],
  };
}

function getStore(): MockPeticoesOperacionalStore {
  const globalStore = globalThis as typeof globalThis & { [STORE_KEY]?: MockPeticoesOperacionalStore };
  if (!globalStore[STORE_KEY]) {
    globalStore[STORE_KEY] = criarSeed();
  }

  return globalStore[STORE_KEY];
}

class MockPipelineSnapshotRepository implements PipelineSnapshotRepository {
  async listarPorPedido(pedidoId: string): Promise<SnapshotPipelineEtapa[]> {
    const store = getStore();
    return store.snapshots
      .filter((snapshot) => snapshot.pedidoId === pedidoId)
      .slice()
      .sort((a, b) => new Date(b.executadoEm).getTime() - new Date(a.executadoEm).getTime());
  }

  async obterUltimoPorEtapa(pedidoId: string, etapa: EtapaPipeline): Promise<SnapshotPipelineEtapa | null> {
    const snapshots = await this.listarPorPedido(pedidoId);
    const snapshot = snapshots.find((item) => item.etapa === etapa);
    return snapshot ?? null;
  }

  async salvarNovaVersao(input: {
    pedidoId: string;
    etapa: EtapaPipeline;
    entradaRef: Record<string, unknown>;
    saidaEstruturada: Record<string, unknown>;
    status: SnapshotPipelineEtapa["status"];
    executadoEm?: string;
    codigoErro?: string;
    mensagemErro?: string;
    tentativa: number;
  }): Promise<SnapshotPipelineEtapa> {
    const store = getStore();
    const ultimo = await this.obterUltimoPorEtapa(input.pedidoId, input.etapa);

    const snapshot: SnapshotPipelineEtapa = {
      id: gerarId("SNP"),
      pedidoId: input.pedidoId,
      etapa: input.etapa,
      versao: ultimo ? ultimo.versao + 1 : 1,
      entradaRef: input.entradaRef,
      saidaEstruturada: input.saidaEstruturada,
      status: input.status,
      executadoEm: input.executadoEm ?? new Date().toISOString(),
      codigoErro: input.codigoErro,
      mensagemErro: input.mensagemErro,
      tentativa: input.tentativa,
    };

    store.snapshots.push(snapshot);
    return snapshot;
  }
}

class MockContextoJuridicoPedidoRepository implements ContextoJuridicoPedidoRepository {
  async listarVersoes(pedidoId: string): Promise<ContextoJuridicoPedido[]> {
    const store = getStore();
    return store.contextos
      .filter((contexto) => contexto.pedidoId === pedidoId)
      .slice()
      .sort((a, b) => b.versaoContexto - a.versaoContexto);
  }

  async obterUltimaVersao(pedidoId: string): Promise<ContextoJuridicoPedido | null> {
    const contextos = await this.listarVersoes(pedidoId);
    return contextos[0] ?? null;
  }

  async salvarNovaVersao(input: Omit<ContextoJuridicoPedido, "id" | "criadoEm">): Promise<ContextoJuridicoPedido> {
    const store = getStore();
    const contexto: ContextoJuridicoPedido = {
      ...input,
      id: gerarId("CTX"),
      criadoEm: new Date().toISOString(),
    };

    store.contextos.push(contexto);
    return contexto;
  }
}

class MockMinutaRastroContextoRepository implements MinutaRastroContextoRepository {
  async upsertVinculo(input: {
    minutaId: string;
    versaoId: string;
    pedidoId: string;
    numeroVersao: number;
    contextoVersao: number;
  }): Promise<void> {
    const store = getStore();
    const existente = store.rastros.find((item) => item.versaoId === input.versaoId);

    if (existente) {
      existente.contextoVersao = input.contextoVersao;
      existente.pedidoId = input.pedidoId;
      existente.numeroVersao = input.numeroVersao;
      existente.minutaId = input.minutaId;
      return;
    }

    store.rastros.push(input);
  }

  async listarPorMinuta(minutaId: string): Promise<Array<{ versaoId: string; contextoVersao: number }>> {
    const store = getStore();
    return store.rastros
      .filter((item) => item.minutaId === minutaId)
      .map((item) => ({ versaoId: item.versaoId, contextoVersao: item.contextoVersao }));
  }
}

export function createMockPeticoesOperacionalInfra() {
  return {
    pipelineSnapshotRepository: new MockPipelineSnapshotRepository(),
    contextoJuridicoPedidoRepository: new MockContextoJuridicoPedidoRepository(),
    minutaRastroContextoRepository: new MockMinutaRastroContextoRepository(),
  };
}
