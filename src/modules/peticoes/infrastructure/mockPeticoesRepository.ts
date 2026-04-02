import type {
  EtapaPipelineInfo,
  HistoricoPipeline,
  Minuta,
  NovoPedidoPayload,
  PedidoDePeca,
  TipoPeca,
} from "@/modules/peticoes/domain/types";

export interface PeticoesRepository {
  listarPedidos(): PedidoDePeca[];
  obterPedidoPorId(pedidoId: string): PedidoDePeca | undefined;
  listarEtapasPipeline(): EtapaPipelineInfo[];
  listarHistoricoPipeline(pedidoId: string): HistoricoPipeline[];
  obterMinutaPorId(minutaId: string): Minuta | undefined;
  obterMinutaPorPedidoId(pedidoId: string): Minuta | undefined;
  simularCriacaoPedido(payload: NovoPedidoPayload): PedidoDePeca;
  listarTiposPeca(): TipoPeca[];
}

export class MockPeticoesRepository implements PeticoesRepository {
  private readonly etapas: EtapaPipelineInfo[] = [
    { id: "classificacao", nome: "Classificação", priorizadaMvp: true },
    { id: "leitura_documental", nome: "Leitura documental", priorizadaMvp: true },
    { id: "extracao_de_fatos", nome: "Extração de fatos", priorizadaMvp: true },
    { id: "analise_adversa", nome: "Análise adversa", priorizadaMvp: false },
    {
      id: "analise_documental_do_cliente",
      nome: "Análise documental do cliente",
      priorizadaMvp: false,
    },
    { id: "estrategia_juridica", nome: "Estratégia jurídica", priorizadaMvp: true },
    { id: "pesquisa_de_apoio", nome: "Pesquisa de apoio", priorizadaMvp: false },
    { id: "redacao", nome: "Redação", priorizadaMvp: true },
    { id: "revisao", nome: "Revisão", priorizadaMvp: true },
    { id: "aprovacao", nome: "Aprovação", priorizadaMvp: false },
  ];

  private readonly pedidos: PedidoDePeca[] = [
    {
      id: "PED-2026-001",
      casoId: "CAS-2026-001",
      titulo: "Petição inicial com pedido liminar",
      tipoPeca: "Petição inicial",
      prioridade: "alta",
      status: "em produção",
      etapaAtual: "extracao_de_fatos",
      responsavel: "Mariana Couto",
      prazoFinal: "2026-04-09",
      criadoEm: "2026-03-30T09:00:00-03:00",
    },
    {
      id: "PED-2026-002",
      casoId: "CAS-2026-002",
      titulo: "Contestação trabalhista",
      tipoPeca: "Contestação",
      prioridade: "média",
      status: "em revisão",
      etapaAtual: "revisao",
      responsavel: "Thiago Martins",
      prazoFinal: "2026-04-05",
      criadoEm: "2026-03-28T10:00:00-03:00",
    },
  ];

  private readonly historicoPorPedido: Record<string, HistoricoPipeline[]> = {
    "PED-2026-001": [
      {
        id: "HIS-001",
        etapa: "classificacao",
        descricao: "Caso classificado como Cível Empresarial.",
        data: "2026-03-30T09:20:00-03:00",
        responsavel: "Equipe de triagem",
      },
      {
        id: "HIS-002",
        etapa: "leitura_documental",
        descricao: "Documentos base analisados e indexados.",
        data: "2026-03-31T10:10:00-03:00",
        responsavel: "Assistente jurídico",
      },
      {
        id: "HIS-003",
        etapa: "extracao_de_fatos",
        descricao: "Fatos relevantes estruturados para estratégia.",
        data: "2026-04-01T14:00:00-03:00",
        responsavel: "Mariana Couto",
      },
    ],
    "PED-2026-002": [
      {
        id: "HIS-010",
        etapa: "classificacao",
        descricao: "Classificação trabalhista concluída.",
        data: "2026-03-28T10:15:00-03:00",
        responsavel: "Equipe de triagem",
      },
      {
        id: "HIS-011",
        etapa: "redacao",
        descricao: "Minuta base finalizada para revisão técnica.",
        data: "2026-04-01T18:40:00-03:00",
        responsavel: "Thiago Martins",
      },
      {
        id: "HIS-012",
        etapa: "revisao",
        descricao: "Revisão jurídica em andamento com apontamentos.",
        data: "2026-04-02T08:30:00-03:00",
        responsavel: "Coordenação jurídica",
      },
    ],
  };

  private readonly minutas: Minuta[] = [
    {
      id: "MIN-2026-001",
      pedidoId: "PED-2026-001",
      titulo: "Minuta - Petição inicial Atlas Engenharia",
      conteudoAtual:
        "I. Dos fatos\n\nA parte autora celebrou contrato de fornecimento em 12/05/2024, com cláusula de entrega sob multa diária...\n\nII. Do direito\n\nNos termos dos artigos 300 e 497 do CPC...",
      versoes: [
        {
          id: "VER-001",
          numero: 1,
          criadoEm: "2026-03-31T09:10:00-03:00",
          autor: "Mariana Couto",
          resumoMudancas: "Estrutura inicial da narrativa fática.",
          conteudo:
            "I. Dos fatos\n\nA parte autora celebrou contrato de fornecimento em 12/05/2024...",
        },
        {
          id: "VER-002",
          numero: 2,
          criadoEm: "2026-04-01T16:45:00-03:00",
          autor: "Mariana Couto",
          resumoMudancas: "Inclusão de pedidos liminares e fundamento no CPC.",
          conteudo:
            "I. Dos fatos\n\nA parte autora celebrou contrato de fornecimento em 12/05/2024, com cláusula de entrega sob multa diária...\n\nII. Do direito\n\nNos termos dos artigos 300 e 497 do CPC...",
        },
      ],
    },
  ];

  listarPedidos(): PedidoDePeca[] {
    return this.pedidos;
  }

  obterPedidoPorId(pedidoId: string): PedidoDePeca | undefined {
    return this.pedidos.find((pedido) => pedido.id === pedidoId);
  }

  listarEtapasPipeline(): EtapaPipelineInfo[] {
    return this.etapas;
  }

  listarHistoricoPipeline(pedidoId: string): HistoricoPipeline[] {
    return this.historicoPorPedido[pedidoId] ?? [];
  }

  obterMinutaPorId(minutaId: string): Minuta | undefined {
    return this.minutas.find((minuta) => minuta.id === minutaId);
  }

  obterMinutaPorPedidoId(pedidoId: string): Minuta | undefined {
    return this.minutas.find((minuta) => minuta.pedidoId === pedidoId);
  }

  simularCriacaoPedido(payload: NovoPedidoPayload): PedidoDePeca {
    const novoId = `PED-MOCK-${Math.floor(Math.random() * 9000) + 1000}`;

    return {
      id: novoId,
      casoId: payload.casoId,
      titulo: payload.titulo,
      tipoPeca: payload.tipoPeca,
      prioridade: payload.prioridade,
      status: "em triagem",
      etapaAtual: "classificacao",
      responsavel: "Distribuição automática",
      prazoFinal: payload.prazoFinal,
      criadoEm: new Date().toISOString(),
    };
  }

  listarTiposPeca(): TipoPeca[] {
    return ["Petição inicial", "Contestação", "Réplica", "Recurso", "Manifestação"];
  }
}
