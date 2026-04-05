import type {
  EtapaPipelineInfo,
  HistoricoPipeline,
  Minuta,
  NovoPedidoPayload,
  PedidoDePeca,
  TipoPeca,
} from "@/modules/peticoes/domain/types";
import { TODOS_TIPOS_PECA } from "@/modules/peticoes/domain/types";

export interface PeticoesRepository {
  listarPedidos(): Promise<PedidoDePeca[]>;
  obterPedidoPorId(pedidoId: string): Promise<PedidoDePeca | undefined>;
  listarEtapasPipeline(): Promise<EtapaPipelineInfo[]>;
  listarHistoricoPipeline(pedidoId: string): Promise<HistoricoPipeline[]>;
  obterMinutaPorId(minutaId: string): Promise<Minuta | undefined>;
  obterMinutaPorPedidoId(pedidoId: string): Promise<Minuta | undefined>;
  simularCriacaoPedido(payload: NovoPedidoPayload): Promise<PedidoDePeca>;
  listarTiposPeca(): Promise<TipoPeca[]>;
}

export class MockPeticoesRepository implements PeticoesRepository {
  private readonly etapas: EtapaPipelineInfo[] = [
    { id: "classificacao", nome: "Classificação", priorizadaMvp: true },
    { id: "leitura_documental", nome: "Leitura documental", priorizadaMvp: true },
    { id: "extracao_de_fatos", nome: "Extração de fatos", priorizadaMvp: true },
    { id: "analise_adversa", nome: "Análise adversa", priorizadaMvp: false },
    { id: "analise_documental_do_cliente", nome: "Análise documental do cliente", priorizadaMvp: false },
    { id: "estrategia_juridica", nome: "Estratégia jurídica", priorizadaMvp: true },
    { id: "pesquisa_de_apoio", nome: "Pesquisa de apoio", priorizadaMvp: false },
    { id: "redacao", nome: "Redação", priorizadaMvp: true },
    { id: "revisao", nome: "Revisão", priorizadaMvp: true },
    { id: "aprovacao", nome: "Aprovação", priorizadaMvp: false },
  ];

  // ──────────────────────────────────────────────────────────────
  // PEDIDOS DE PEÇA (12 pedidos cobrindo todos os tipos)
  // ──────────────────────────────────────────────────────────────
  private readonly pedidos: PedidoDePeca[] = [
    // 1. Petição Inicial — CAS-001
    {
      id: "PED-2026-001",
      casoId: "CAS-2026-001",
      titulo: "Petição inicial com pedido liminar — Rescisão Contratual",
      tipoPeca: "Petição inicial",
      prioridade: "alta",
      status: "em produção",
      etapaAtual: "extracao_de_fatos",
      responsavel: "Mariana Couto",
      prazoFinal: "2026-04-09",
      criadoEm: "2026-03-30T09:00:00-03:00",
    },
    // 2. Contestação — CAS-002
    {
      id: "PED-2026-002",
      casoId: "CAS-2026-002",
      titulo: "Contestação trabalhista — Horas Extras e Adicional Noturno",
      tipoPeca: "Contestação",
      prioridade: "média",
      status: "em revisão",
      etapaAtual: "revisao",
      responsavel: "Thiago Martins",
      prazoFinal: "2026-04-05",
      criadoEm: "2026-03-28T10:00:00-03:00",
    },
    // 3. Réplica — CAS-002
    {
      id: "PED-2026-003",
      casoId: "CAS-2026-002",
      titulo: "Réplica à contestação — Impugnação de documentos",
      tipoPeca: "Réplica",
      prioridade: "média",
      status: "em triagem",
      etapaAtual: "classificacao",
      responsavel: "Distribuição automática",
      prazoFinal: "2026-04-08",
      criadoEm: "2026-04-02T08:00:00-03:00",
    },
    // 4. Embargos à execução — CAS-010
    {
      id: "PED-2026-004",
      casoId: "CAS-2026-010",
      titulo: "Embargos à execução — CPR Fazenda Santa Clara",
      tipoPeca: "Embargos à execução",
      prioridade: "alta",
      status: "em produção",
      etapaAtual: "estrategia_juridica",
      responsavel: "Carlos Mendes",
      prazoFinal: "2026-04-10",
      criadoEm: "2026-03-27T10:30:00-03:00",
    },
    // 5. Impugnação — CAS-008
    {
      id: "PED-2026-005",
      casoId: "CAS-2026-008",
      titulo: "Impugnação ao cumprimento de sentença — Juros compostos",
      tipoPeca: "Impugnação",
      prioridade: "média",
      status: "em produção",
      etapaAtual: "leitura_documental",
      responsavel: "Mariana Couto",
      prazoFinal: "2026-04-22",
      criadoEm: "2026-04-01T14:30:00-03:00",
    },
    // 6. Mandado de Segurança — CAS-003
    {
      id: "PED-2026-006",
      casoId: "CAS-2026-003",
      titulo: "Mandado de segurança — Suspensão ICMS transferências",
      tipoPeca: "Mandado de segurança",
      prioridade: "alta",
      status: "em produção",
      etapaAtual: "redacao",
      responsavel: "Carlos Mendes",
      prazoFinal: "2026-04-15",
      criadoEm: "2026-04-01T09:00:00-03:00",
    },
    // 7. Habeas Corpus — CAS-006
    {
      id: "PED-2026-007",
      casoId: "CAS-2026-006",
      titulo: "Habeas Corpus — Revogação de preventiva (furto simples)",
      tipoPeca: "Habeas corpus",
      prioridade: "alta",
      status: "aprovado",
      etapaAtual: "aprovacao",
      responsavel: "Gilberto Jacob",
      prazoFinal: "2026-04-04",
      criadoEm: "2026-04-02T07:00:00-03:00",
    },
    // 8. Agravo de Instrumento — CAS-005
    {
      id: "PED-2026-008",
      casoId: "CAS-2026-005",
      titulo: "Agravo de instrumento — Tutela revisional de alimentos",
      tipoPeca: "Agravo de instrumento",
      prioridade: "alta",
      status: "em produção",
      etapaAtual: "redacao",
      responsavel: "Thiago Martins",
      prazoFinal: "2026-04-12",
      criadoEm: "2026-03-29T15:00:00-03:00",
    },
    // 9. Reconvenção — CAS-007
    {
      id: "PED-2026-009",
      casoId: "CAS-2026-007",
      titulo: "Reconvenção — Indenização por danos ao patrimônio societário",
      tipoPeca: "Reconvenção",
      prioridade: "média",
      status: "em produção",
      etapaAtual: "extracao_de_fatos",
      responsavel: "Mariana Couto",
      prazoFinal: "2026-04-18",
      criadoEm: "2026-04-01T11:00:00-03:00",
    },
    // 10. Apelação Cível — CAS-004
    {
      id: "PED-2026-010",
      casoId: "CAS-2026-004",
      titulo: "Apelação cível — Majoração de indenização por defeito veicular",
      tipoPeca: "Apelação cível",
      prioridade: "baixa",
      status: "em triagem",
      etapaAtual: "classificacao",
      responsavel: "Distribuição automática",
      prazoFinal: "2026-04-20",
      criadoEm: "2026-04-02T09:30:00-03:00",
    },
    // 11. Pedido de Tutela de Urgência — CAS-001
    {
      id: "PED-2026-011",
      casoId: "CAS-2026-001",
      titulo: "Pedido de tutela de urgência — Suspensão de multas",
      tipoPeca: "Pedido de tutela de urgência",
      prioridade: "alta",
      status: "em revisão",
      etapaAtual: "revisao",
      responsavel: "Carlos Mendes",
      prazoFinal: "2026-04-06",
      criadoEm: "2026-04-01T08:00:00-03:00",
    },
    // 12. Contrarrazões — CAS-009
    {
      id: "PED-2026-012",
      casoId: "CAS-2026-009",
      titulo: "Contrarrazões de recurso — Auto de infração IBAMA",
      tipoPeca: "Contrarrazões",
      prioridade: "baixa",
      status: "em triagem",
      etapaAtual: "classificacao",
      responsavel: "Distribuição automática",
      prazoFinal: "2026-04-25",
      criadoEm: "2026-04-02T08:30:00-03:00",
    },
    // ──────────────────────────────────────────────────────────
    // PEDIDOS AGRÁRIOS ESPECIALIZADOS (13-18)
    // ──────────────────────────────────────────────────────────
    // 13. Petição Inicial — Usucapião Rural — CAS-011
    {
      id: "PED-2026-013",
      casoId: "CAS-2026-011",
      titulo: "Petição inicial — Usucapião rural pro labore",
      tipoPeca: "Petição inicial",
      prioridade: "média",
      status: "em produção",
      etapaAtual: "redacao",
      responsavel: "Carlos Mendes",
      prazoFinal: "2026-05-20",
      criadoEm: "2026-03-15T09:00:00-03:00",
    },
    // 14. Reintegração de Posse — CAS-014
    {
      id: "PED-2026-014",
      casoId: "CAS-2026-014",
      titulo: "Petição inicial — Reintegração de posse c/ liminar e força policial",
      tipoPeca: "Petição inicial",
      prioridade: "alta",
      status: "aprovado",
      etapaAtual: "aprovacao",
      responsavel: "Gilberto Jacob",
      prazoFinal: "2026-04-08",
      criadoEm: "2026-04-01T07:00:00-03:00",
    },
    // 15. Renovatória de Arrendamento — CAS-012
    {
      id: "PED-2026-015",
      casoId: "CAS-2026-012",
      titulo: "Ação renovatória de arrendamento rural — Fazenda Boa Vista",
      tipoPeca: "Petição inicial",
      prioridade: "média",
      status: "em produção",
      etapaAtual: "estrategia_juridica",
      responsavel: "Mariana Couto",
      prazoFinal: "2026-04-30",
      criadoEm: "2026-03-20T10:30:00-03:00",
    },
    // 16. Execução de CPR — CAS-013
    {
      id: "PED-2026-016",
      casoId: "CAS-2026-013",
      titulo: "Petição inicial — Execução de CPR-F (R$ 5,6M)",
      tipoPeca: "Petição inicial",
      prioridade: "alta",
      status: "em produção",
      etapaAtual: "redacao",
      responsavel: "Carlos Mendes",
      prazoFinal: "2026-04-18",
      criadoEm: "2026-03-22T08:30:00-03:00",
    },
    // 17. Exceção de pré-executividade — CAS-013 (defesa do devedor)
    {
      id: "PED-2026-017",
      casoId: "CAS-2026-013",
      titulo: "Exceção de pré-executividade — Nulidade de endosso na CPR",
      tipoPeca: "Exceção de pré-executividade",
      prioridade: "alta",
      status: "em triagem",
      etapaAtual: "classificacao",
      responsavel: "Distribuição automática",
      prazoFinal: "2026-04-15",
      criadoEm: "2026-04-02T16:00:00-03:00",
    },
    // 18. Revisional de Crédito Rural — CAS-015
    {
      id: "PED-2026-018",
      casoId: "CAS-2026-015",
      titulo: "Ação revisional de contrato de crédito rural — custeio agrícola",
      tipoPeca: "Petição inicial",
      prioridade: "média",
      status: "em triagem",
      etapaAtual: "classificacao",
      responsavel: "Distribuição automática",
      prazoFinal: "2026-05-10",
      criadoEm: "2026-04-02T10:00:00-03:00",
    },
    // 19. Exceção de pré-executividade — CAS-016
    {
      id: "PED-2026-019",
      casoId: "CAS-2026-016",
      titulo: "Exceção de pré-executividade — Impenhorabilidade Rural",
      tipoPeca: "Exceção de pré-executividade",
      prioridade: "alta",
      status: "em produção",
      etapaAtual: "redacao",
      responsavel: "Thiago Martins",
      prazoFinal: "2026-04-12",
      criadoEm: "2026-04-02T11:30:00-03:00",
    },
    // 20. Mandado de Segurança — CAS-017
    {
      id: "PED-2026-020",
      casoId: "CAS-2026-017",
      titulo: "Mandado de Segurança — Prorrogação Súmula 298 STJ",
      tipoPeca: "Mandado de segurança",
      prioridade: "alta",
      status: "em produção",
      etapaAtual: "estrategia_juridica",
      responsavel: "Mariana Couto",
      prazoFinal: "2026-04-14",
      criadoEm: "2026-04-02T14:30:00-03:00",
    },
  ];

  // ──────────────────────────────────────────────────────────────
  // HISTÓRICO DO PIPELINE
  // ──────────────────────────────────────────────────────────────
  private readonly historicoPorPedido: Record<string, HistoricoPipeline[]> = {
    "PED-2026-001": [
      { id: "HIS-001", etapa: "classificacao", descricao: "Caso classificado como Cível Empresarial — prioridade alta.", data: "2026-03-30T09:20:00-03:00", responsavel: "Equipe de triagem" },
      { id: "HIS-002", etapa: "leitura_documental", descricao: "3 documentos analisados: contrato, notificação extrajudicial e e-mails.", data: "2026-03-31T10:10:00-03:00", responsavel: "Assistente jurídico" },
      { id: "HIS-003", etapa: "extracao_de_fatos", descricao: "12 fatos relevantes estruturados. Cronologia validada.", data: "2026-04-01T14:00:00-03:00", responsavel: "Mariana Couto" },
    ],
    "PED-2026-002": [
      { id: "HIS-010", etapa: "classificacao", descricao: "Classificação trabalhista concluída — TRT-2.", data: "2026-03-28T10:15:00-03:00", responsavel: "Equipe de triagem" },
      { id: "HIS-011", etapa: "leitura_documental", descricao: "Cartões de ponto e contracheques analisados.", data: "2026-03-29T11:00:00-03:00", responsavel: "Assistente jurídico" },
      { id: "HIS-012", etapa: "extracao_de_fatos", descricao: "Inconsistências nos registros de ponto identificadas.", data: "2026-03-30T14:00:00-03:00", responsavel: "Thiago Martins" },
      { id: "HIS-013", etapa: "redacao", descricao: "Minuta base da contestação finalizada.", data: "2026-04-01T18:40:00-03:00", responsavel: "Thiago Martins" },
      { id: "HIS-014", etapa: "revisao", descricao: "Revisão jurídica com 3 apontamentos pendentes.", data: "2026-04-02T08:30:00-03:00", responsavel: "Coordenação jurídica" },
    ],
    "PED-2026-004": [
      { id: "HIS-020", etapa: "classificacao", descricao: "Caso agrário — embargos à execução de CPR.", data: "2026-03-27T11:00:00-03:00", responsavel: "Equipe de triagem" },
      { id: "HIS-021", etapa: "leitura_documental", descricao: "CPR, laudo agronômico e notificações analisados.", data: "2026-03-28T15:00:00-03:00", responsavel: "Assistente jurídico" },
      { id: "HIS-022", etapa: "extracao_de_fatos", descricao: "Seca extrema em MT documentada com dados do INMET.", data: "2026-03-30T10:00:00-03:00", responsavel: "Carlos Mendes" },
      { id: "HIS-023", etapa: "estrategia_juridica", descricao: "Estratégia baseada em caso fortuito (art. 393, CC) aprovada.", data: "2026-04-01T09:30:00-03:00", responsavel: "Carlos Mendes" },
    ],
    "PED-2026-006": [
      { id: "HIS-030", etapa: "classificacao", descricao: "Tributário — mandado de segurança contra ICMS.", data: "2026-04-01T09:15:00-03:00", responsavel: "Equipe de triagem" },
      { id: "HIS-031", etapa: "leitura_documental", descricao: "Notas fiscais, guias DARE e decisão do TARF analisados.", data: "2026-04-01T14:00:00-03:00", responsavel: "Assistente jurídico" },
      { id: "HIS-032", etapa: "extracao_de_fatos", descricao: "Base de cálculo do ICMS analisada em 47 operações.", data: "2026-04-01T18:00:00-03:00", responsavel: "Carlos Mendes" },
      { id: "HIS-033", etapa: "estrategia_juridica", descricao: "Fundamentação no Tema 1099/STF definida.", data: "2026-04-02T09:00:00-03:00", responsavel: "Carlos Mendes" },
      { id: "HIS-034", etapa: "redacao", descricao: "Minuta do MS em redação com 6 fundamentos jurídicos.", data: "2026-04-02T14:00:00-03:00", responsavel: "Carlos Mendes" },
    ],
    "PED-2026-007": [
      { id: "HIS-040", etapa: "classificacao", descricao: "URGENTE — HC contra preventiva desproporcional.", data: "2026-04-02T07:15:00-03:00", responsavel: "Gilberto Jacob" },
      { id: "HIS-041", etapa: "leitura_documental", descricao: "Decisão de decretação e inquérito policial analisados.", data: "2026-04-02T08:00:00-03:00", responsavel: "Gilberto Jacob" },
      { id: "HIS-042", etapa: "extracao_de_fatos", descricao: "Réu primário, residência fixa, emprego formal comprovados.", data: "2026-04-02T09:00:00-03:00", responsavel: "Gilberto Jacob" },
      { id: "HIS-043", etapa: "estrategia_juridica", descricao: "Fundamento: desproporcionalidade + medidas cautelares alternativas.", data: "2026-04-02T10:00:00-03:00", responsavel: "Gilberto Jacob" },
      { id: "HIS-044", etapa: "redacao", descricao: "HC redigido com pedido liminar.", data: "2026-04-02T12:00:00-03:00", responsavel: "Gilberto Jacob" },
      { id: "HIS-045", etapa: "revisao", descricao: "Revisão aprovada sem ressalvas.", data: "2026-04-02T13:30:00-03:00", responsavel: "Coordenação jurídica" },
      { id: "HIS-046", etapa: "aprovacao", descricao: "HC aprovado e protocolado no TJSP.", data: "2026-04-02T15:00:00-03:00", responsavel: "Gilberto Jacob" },
    ],
    "PED-2026-008": [
      { id: "HIS-050", etapa: "classificacao", descricao: "Família — agravo contra decisão de alimentos.", data: "2026-03-29T15:15:00-03:00", responsavel: "Equipe de triagem" },
      { id: "HIS-051", etapa: "leitura_documental", descricao: "Decisão interlocutória e documentos de renda analisados.", data: "2026-03-30T10:00:00-03:00", responsavel: "Assistente jurídico" },
      { id: "HIS-052", etapa: "extracao_de_fatos", descricao: "Perda de emprego formal comprovada via CTPS e CAGED.", data: "2026-03-31T14:00:00-03:00", responsavel: "Thiago Martins" },
      { id: "HIS-053", etapa: "redacao", descricao: "Agravo de instrumento em fase de redação.", data: "2026-04-02T10:00:00-03:00", responsavel: "Thiago Martins" },
    ],
    "PED-2026-009": [
      { id: "HIS-060", etapa: "classificacao", descricao: "Empresarial — reconvenção em dissolução societária.", data: "2026-04-01T11:15:00-03:00", responsavel: "Equipe de triagem" },
      { id: "HIS-061", etapa: "leitura_documental", descricao: "Contrato social, balanços e atas de assembleia analisados.", data: "2026-04-01T16:00:00-03:00", responsavel: "Assistente jurídico" },
      { id: "HIS-062", etapa: "extracao_de_fatos", descricao: "Distribuição irregular de lucros de R$ 1,2M identificada.", data: "2026-04-02T10:00:00-03:00", responsavel: "Mariana Couto" },
    ],
    "PED-2026-011": [
      { id: "HIS-070", etapa: "classificacao", descricao: "Tutela de urgência — suspensão de multas contratuais.", data: "2026-04-01T08:15:00-03:00", responsavel: "Equipe de triagem" },
      { id: "HIS-071", etapa: "leitura_documental", descricao: "Contrato e aditivos contratuais analisados.", data: "2026-04-01T11:00:00-03:00", responsavel: "Assistente jurídico" },
      { id: "HIS-072", etapa: "redacao", descricao: "Petição de tutela redigida com fundamentação no art. 300 CPC.", data: "2026-04-01T18:00:00-03:00", responsavel: "Carlos Mendes" },
      { id: "HIS-073", etapa: "revisao", descricao: "Revisão em andamento — 2 sugestões de melhoria.", data: "2026-04-02T09:00:00-03:00", responsavel: "Coordenação jurídica" },
    ],
    // ──────────────────────────────────────────────────────────
    // HISTÓRICOS AGRÁRIOS (PED-013 a PED-018)
    // ──────────────────────────────────────────────────────────
    "PED-2026-013": [
      { id: "HIS-080", etapa: "classificacao", descricao: "Classificação preliminar: Usucapião rural.", data: "2026-03-15T09:15:00-03:00", responsavel: "Equipe de triagem" },
      { id: "HIS-081", etapa: "leitura_documental", descricao: "Análise da cadeia dominial, CAR e CCIR.", data: "2026-03-25T14:30:00-03:00", responsavel: "Assistente jurídico" },
      { id: "HIS-082", etapa: "extracao_de_fatos", descricao: "Posse mansa, pacífica e ininterrupta confirmada por testemunhas (12 anos).", data: "2026-04-01T10:30:00-03:00", responsavel: "Carlos Mendes" },
      { id: "HIS-083", etapa: "redacao", descricao: "Redação da inicial de usucapião constitucional baseada na função social.", data: "2026-04-02T14:00:00-03:00", responsavel: "Carlos Mendes" },
    ],
    "PED-2026-014": [
      { id: "HIS-090", etapa: "classificacao", descricao: "URGENTE: Esbulho possessório — Invasão de terras.", data: "2026-04-01T07:10:00-03:00", responsavel: "Triagem Prioritária" },
      { id: "HIS-091", etapa: "leitura_documental", descricao: "BO e imagens de satélite/drones verificados; posse anterior comprovada.", data: "2026-04-01T10:30:00-03:00", responsavel: "Assistente jurídico" },
      { id: "HIS-092", etapa: "estrategia_juridica", descricao: "Ação de força nova com liminar inaudita altera parte protocolada.", data: "2026-04-01T13:00:00-03:00", responsavel: "Gilberto Jacob" },
      { id: "HIS-093", etapa: "redacao", descricao: "Petição gerada e revisada no mesmo diz.", data: "2026-04-01T16:00:00-03:00", responsavel: "Gilberto Jacob" },
      { id: "HIS-094", etapa: "aprovacao", descricao: "O.K. pelo cliente. Protocolada sob urgência.", data: "2026-04-02T08:00:00-03:00", responsavel: "Gilberto Jacob" },
    ],
    "PED-2026-015": [
      { id: "HIS-100", etapa: "classificacao", descricao: "Renovatória de Arrendamento Rural — Estatuto da Terra.", data: "2026-03-20T10:45:00-03:00", responsavel: "Equipe de triagem" },
      { id: "HIS-101", etapa: "leitura_documental", descricao: "Verificando notificações extrajudiciais de retomada e prazos.", data: "2026-03-20T14:00:00-03:00", responsavel: "Assistente jurídico" },
      { id: "HIS-102", etapa: "estrategia_juridica", descricao: "Estatuto da terra, art. 95 IV e V — prazo mínimo e direito de retenção de benfeitorias.", data: "2026-04-02T11:00:00-03:00", responsavel: "Mariana Couto" },
    ],
    "PED-2026-016": [
      { id: "HIS-110", etapa: "classificacao", descricao: "Módulo Agronegócio: Execução de Título Extrajudicial (CPR).", data: "2026-03-22T08:40:00-03:00", responsavel: "Equipe de triagem" },
      { id: "HIS-111", etapa: "leitura_documental", descricao: "Exame formal de liquidez e certeza da CPR e do endosso translativo.", data: "2026-03-22T15:00:00-03:00", responsavel: "Assistente jurídico" },
      { id: "HIS-112", etapa: "extracao_de_fatos", descricao: "Inadimplemento caracterizado e busca patrimonial positiva.", data: "2026-04-01T11:30:00-03:00", responsavel: "Carlos Mendes" },
      { id: "HIS-113", etapa: "redacao", descricao: "Redação com pedidos de tutela arresto de grãos nos armazéns credenciados.", data: "2026-04-02T09:00:00-03:00", responsavel: "Carlos Mendes" },
    ],
    "PED-2026-017": [
      { id: "HIS-120", etapa: "classificacao", descricao: "Defesa prévia do executado — Agronegócio.", data: "2026-04-02T16:10:00-03:00", responsavel: "Distribuição automática" },
    ],
    "PED-2026-018": [
      { id: "HIS-130", etapa: "classificacao", descricao: "Revisional de Financiamento / Custeio Agrícola.", data: "2026-04-02T10:15:00-03:00", responsavel: "Distribuição automática" },
    ],
    "PED-2026-019": [
      { id: "HIS-140", etapa: "classificacao", descricao: "Classificação: Exceção de Pré-Executividade (Defesa de Patrimônio / Impenhorabilidade).", data: "2026-04-02T11:45:00-03:00", responsavel: "Equipe de triagem" },
      { id: "HIS-141", etapa: "leitura_documental", descricao: "Mandado de penhora e documentos do sindicato rural processados.", data: "2026-04-02T14:00:00-03:00", responsavel: "Assistente jurídico" },
      { id: "HIS-142", etapa: "extracao_de_fatos", descricao: "Comprovada área inferior a 4 módulos fiscais e regime familiar puro.", data: "2026-04-02T16:00:00-03:00", responsavel: "Thiago Martins" },
    ],
    "PED-2026-020": [
      { id: "HIS-150", etapa: "classificacao", descricao: "Mandado de Segurança contra gerente de banco público.", data: "2026-04-02T15:00:00-03:00", responsavel: "Equipe de triagem" },
      { id: "HIS-151", etapa: "leitura_documental", descricao: "Requerimento administrativo e laudos de quebra de safra validados.", data: "2026-04-02T16:30:00-03:00", responsavel: "Assistente jurídico" },
      { id: "HIS-152", etapa: "estrategia_juridica", descricao: "Fundamento central: Súmula 298 do STJ - Direito potestativo do produtor.", data: "2026-04-02T17:00:00-03:00", responsavel: "Mariana Couto" },
    ],
  };

  // ──────────────────────────────────────────────────────────────
  // MINUTAS (8 minutas com versões realistas)
  // ──────────────────────────────────────────────────────────────
  private readonly minutas: Minuta[] = [
    // MIN-001: Petição inicial — CAS-001
    {
      id: "MIN-2026-001",
      pedidoId: "PED-2026-001",
      titulo: "Minuta - Petição Inicial — Rescisão Contratual Atlas Engenharia",
      conteudoAtual:
        "EXCELENTÍSSIMO SENHOR DOUTOR JUIZ DE DIREITO DA ___ VARA CÍVEL DO FORO CENTRAL DA COMARCA DE SÃO PAULO - SP\n\nATLAS ENGENHARIA S.A., inscrita no CNPJ sob o nº XX.XXX.XXX/0001-XX, vem respeitosamente à presença de Vossa Excelência propor a presente\n\nAÇÃO DE RESCISÃO CONTRATUAL CUMULADA COM PEDIDO DE TUTELA DE URGÊNCIA\n\nem face de DELTA FORNECIMENTOS LTDA., pelos fatos e fundamentos a seguir expostos.\n\nI. DOS FATOS\n\nA parte autora celebrou contrato de fornecimento em 12/05/2024 (DOC-001), com cláusula de entrega sob multa diária de R$ 45.000,00. A ré descumpriu reiteradamente os prazos de entrega, acumulando atraso superior a 90 dias.\n\nII. DO DIREITO\n\nNos termos dos artigos 300 e 497 do CPC, bem como dos artigos 475 e 476 do Código Civil, resta configurado o inadimplemento contratual pela ré.\n\nIII. DOS PEDIDOS\n\na) Tutela de urgência para suspensão imediata das multas contratuais;\nb) Rescisão do contrato por culpa exclusiva da ré;\nc) Condenação ao pagamento de perdas e danos;\nd) Condenação em honorários advocatícios e custas processuais.",
      versoes: [
        {
          id: "VER-001", numero: 1, criadoEm: "2026-03-31T09:10:00-03:00", autor: "Mariana Couto",
          resumoMudancas: "Estrutura inicial da narrativa fática com 12 fatos cronológicos.",
          contextoVersaoOrigem: 1,
          conteudo: "I. DOS FATOS\n\nA parte autora celebrou contrato de fornecimento em 12/05/2024...",
        },
        {
          id: "VER-002", numero: 2, criadoEm: "2026-04-01T16:45:00-03:00", autor: "Mariana Couto",
          resumoMudancas: "Inclusão de pedidos liminares, fundamento no CPC e qualificação das partes.",
          contextoVersaoOrigem: 2,
          conteudo: "EXCELENTÍSSIMO SENHOR DOUTOR JUIZ DE DIREITO...\n\nI. DOS FATOS\n\nA parte autora celebrou contrato de fornecimento em 12/05/2024, com cláusula de entrega sob multa diária de R$ 45.000,00...\n\nII. DO DIREITO\n\nNos termos dos artigos 300 e 497 do CPC...\n\nIII. DOS PEDIDOS\n\na) Tutela de urgência para suspensão imediata das multas contratuais;",
        },
      ],
    },
    // MIN-002: Contestação trabalhista — CAS-002
    {
      id: "MIN-2026-002",
      pedidoId: "PED-2026-002",
      titulo: "Minuta - Contestação Trabalhista — Horas Extras",
      conteudoAtual:
        "EXCELENTÍSSIMO SENHOR DOUTOR JUIZ DO TRABALHO DA ___ VARA DO TRABALHO DE SÃO PAULO - SP\n\nREDE SUPERNOVA COMÉRCIO LTDA., já qualificada nos autos, vem apresentar CONTESTAÇÃO à reclamação trabalhista movida por Thiago Alves.\n\nI. SÍNTESE DA DEFESA\n\nA reclamada impugna integralmente os pedidos de horas extras e adicional noturno. Os registros de ponto eletrônico (DOC-004) comprovam que o reclamante jamais excedeu a jornada contratual de 44 horas semanais.\n\nII. DOS FATOS\n\nO reclamante foi admitido em 15/03/2023 como auxiliar de loja, com jornada de segunda a sábado. O sistema de ponto eletrônico biométrico registra fielmente entrada e saída.\n\nIII. DO DIREITO\n\nConforme Súmula 338 do TST, o ônus da prova quanto à jornada é do empregador que mantém mais de 10 empregados. A reclamada comprova por registros eletrônicos íntegros.\n\nIV. DOS PEDIDOS\n\na) Improcedência total dos pedidos;\nb) Condenação do reclamante em litigância de má-fé.",
      versoes: [
        {
          id: "VER-010", numero: 1, criadoEm: "2026-04-01T18:40:00-03:00", autor: "Thiago Martins",
          resumoMudancas: "Contestação completa com impugnação de documentos e fundamentação no TST.",
          contextoVersaoOrigem: 1,
          conteudo: "CONTESTAÇÃO...\n\nI. SÍNTESE DA DEFESA\n\nA reclamada impugna integralmente os pedidos de horas extras...",
        },
      ],
    },
    // MIN-003: Embargos à execução — CAS-010
    {
      id: "MIN-2026-003",
      pedidoId: "PED-2026-004",
      titulo: "Minuta - Embargos à Execução — CPR Fazenda Santa Clara",
      conteudoAtual:
        "EXCELENTÍSSIMO SENHOR DOUTOR JUIZ DE DIREITO DA ___ VARA CÍVEL DA COMARCA DE CUIABÁ - MT\n\nFAZENDA SANTA CLARA, representada por seu proprietário, vem opor EMBARGOS À EXECUÇÃO em face de TRADING GRÃOS INTERNATIONAL S.A.\n\nI. DA TEMPESTIVIDADE\n\nOs presentes embargos são tempestivos, protocolados dentro do prazo de 15 dias da citação.\n\nII. DOS FATOS\n\nFoi celebrada Cédula de Produto Rural (CPR) no valor de R$ 3.200.000,00 para entrega de 8.000 toneladas de soja. Ocorre que a região sofreu seca extrema (dados INMET), com índice pluviométrico 73% abaixo da média histórica.\n\nIII. DO DIREITO — CASO FORTUITO\n\nNos termos do artigo 393 do Código Civil, o devedor não responde pelos prejuízos resultantes de caso fortuito ou força maior. A seca extrema constitui evento imprevisível e inevitável.\n\nIV. DOS PEDIDOS\n\na) Recebimento e processamento dos embargos com efeito suspensivo;\nb) Reconhecimento do caso fortuito;\nc) Extinção da execução ou redução proporcional do débito.",
      versoes: [
        {
          id: "VER-020", numero: 1, criadoEm: "2026-04-01T16:00:00-03:00", autor: "Carlos Mendes",
          resumoMudancas: "Estrutura inicial dos embargos com fundamentação em caso fortuito (art. 393 CC).",
          contextoVersaoOrigem: 1,
          conteudo: "EMBARGOS À EXECUÇÃO...\n\nI. DA TEMPESTIVIDADE\n\nOs presentes embargos são tempestivos...",
        },
      ],
    },
    // MIN-004: Mandado de Segurança — CAS-003
    {
      id: "MIN-2026-004",
      pedidoId: "PED-2026-006",
      titulo: "Minuta - Mandado de Segurança — ICMS Transferências",
      conteudoAtual:
        "EXCELENTÍSSIMO SENHOR DOUTOR JUIZ FEDERAL DA ___ VARA CÍVEL DA SEÇÃO JUDICIÁRIA DE SÃO PAULO\n\nHORIZONTE LOGÍSTICA LTDA. vem impetrar MANDADO DE SEGURANÇA COM PEDIDO LIMINAR contra ato coator praticado pelo DELEGADO DA RECEITA FEDERAL em São Paulo.\n\nI. DO ATO COATOR\n\nA autoridade impetrada exige recolhimento de ICMS sobre transferências de mercadorias entre filiais da impetrante, em clara violação ao decidido pelo STF no Tema 1099.\n\nII. DO DIREITO LÍQUIDO E CERTO\n\nO Supremo Tribunal Federal, no julgamento do Tema 1099 (ADC 49), decidiu que NÃO incide ICMS sobre transferência de mercadorias entre estabelecimentos do mesmo contribuinte.\n\nIII. DA LIMINAR\n\nPresentes o fumus boni juris e o periculum in mora, requer a concessão de liminar para suspender a exigibilidade do crédito tributário.\n\nIV. DOS PEDIDOS\n\na) Concessão de liminar;\nb) Notificação da autoridade coatora;\nc) Concessão definitiva da segurança.",
      versoes: [
        {
          id: "VER-030", numero: 1, criadoEm: "2026-04-02T14:00:00-03:00", autor: "Carlos Mendes",
          resumoMudancas: "Minuta do MS com fundamentação no Tema 1099/STF e pedido liminar.",
          contextoVersaoOrigem: 1,
          conteudo: "MANDADO DE SEGURANÇA...\n\nI. DO ATO COATOR\n\nA autoridade impetrada exige recolhimento de ICMS...",
        },
      ],
    },
    // MIN-005: Habeas Corpus — CAS-006
    {
      id: "MIN-2026-005",
      pedidoId: "PED-2026-007",
      titulo: "Minuta - Habeas Corpus — Preventiva Desproporcional",
      conteudoAtual:
        "EXCELENTÍSSIMO SENHOR DOUTOR DESEMBARGADOR PRESIDENTE DA ___ CÂMARA CRIMINAL DO TRIBUNAL DE JUSTIÇA DE SÃO PAULO\n\nANDRÉ LUÍS FERREIRA, qualificado nos autos, vem impetrar HABEAS CORPUS COM PEDIDO LIMINAR.\n\nI. DO CONSTRANGIMENTO ILEGAL\n\nO paciente encontra-se preso preventivamente desde 28/03/2026 por suposta prática de furto simples (art. 155, caput, CP), sem violência ou grave ameaça.\n\nII. DA DESPROPORCIONALIDADE\n\nO paciente é primário, possui residência fixa, emprego formal registrado em CTPS e não oferece risco à ordem pública. A prisão preventiva viola o princípio da proporcionalidade.\n\nIII. DAS MEDIDAS CAUTELARES ALTERNATIVAS\n\nNos termos do art. 319 do CPP, existem medidas cautelares diversas da prisão perfeitamente aplicáveis ao caso.\n\nIV. DOS PEDIDOS\n\na) Concessão liminar para expedição de alvará de soltura;\nb) No mérito, revogação definitiva da prisão preventiva;\nc) Subsidiariamente, aplicação de medidas cautelares alternativas.",
      versoes: [
        {
          id: "VER-040", numero: 1, criadoEm: "2026-04-02T12:00:00-03:00", autor: "Gilberto Jacob",
          resumoMudancas: "HC redigido em regime de urgência com pedido liminar. Aprovado sem ressalvas.",
          contextoVersaoOrigem: 1,
          conteudo: "HABEAS CORPUS...\n\nI. DO CONSTRANGIMENTO ILEGAL\n\nO paciente encontra-se preso...",
        },
      ],
    },
    // MIN-006: Agravo de Instrumento — CAS-005
    {
      id: "MIN-2026-006",
      pedidoId: "PED-2026-008",
      titulo: "Minuta - Agravo de Instrumento — Revisional de Alimentos",
      conteudoAtual:
        "EXCELENTÍSSIMO SENHOR DOUTOR DESEMBARGADOR DA ___ CÂMARA DE DIREITO PRIVADO DO TRIBUNAL DE JUSTIÇA DE SÃO PAULO\n\nROBERTO MENDES vem interpor AGRAVO DE INSTRUMENTO contra a decisão interlocutória que indeferiu o pedido de redução provisória da pensão alimentícia.\n\nI. DA DECISÃO AGRAVADA\n\nO juízo a quo indeferiu o pedido de tutela antecipada para redução de 30% para 20% da pensão alimentícia, desconsiderando a comprovada perda de emprego formal.\n\nII. DO DIREITO\n\nA pensão alimentícia deve observar o binômio necessidade-possibilidade (art. 1.694, §1º, CC). A perda de emprego formal altera substancialmente a capacidade contributiva do agravante.\n\nIII. DOS PEDIDOS\n\na) Concessão de efeito ativo ao agravo;\nb) Reforma da decisão para deferir a redução provisória;\nc) Manutenção da pensão em 20% do salário mínimo até julgamento da revisional.",
      versoes: [
        {
          id: "VER-050", numero: 1, criadoEm: "2026-04-02T10:00:00-03:00", autor: "Thiago Martins",
          resumoMudancas: "Agravo fundamentado no binômio necessidade-possibilidade com documentação de renda.",
          contextoVersaoOrigem: 1,
          conteudo: "AGRAVO DE INSTRUMENTO...\n\nI. DA DECISÃO AGRAVADA\n\nO juízo a quo indeferiu...",
        },
      ],
    },
    // MIN-007: Reconvenção — CAS-007
    {
      id: "MIN-2026-007",
      pedidoId: "PED-2026-009",
      titulo: "Minuta - Reconvenção — Danos ao Patrimônio Societário",
      conteudoAtual:
        "I. DA RECONVENÇÃO\n\nO reconvinte, Marcos Tanaka, na qualidade de sócio com 35% do capital social da Nexus Tecnologia Ltda., apresenta reconvenção para pleitear indenização por atos praticados pelo sócio majoritário que causaram prejuízos ao patrimônio societário.\n\nII. DOS FATOS\n\nO reconvindo, Felipe Nogueira, distribuiu lucros de forma irregular no montante de R$ 1.200.000,00, sem aprovação em assembleia e sem observância do contrato social.\n\nIII. DO DIREITO\n\nNos termos dos artigos 1.010 e seguintes do Código Civil, o administrador que age com excesso de poderes responde pessoalmente pelos danos causados.\n\nIV. DOS PEDIDOS\n\na) Indenização por danos materiais ao patrimônio societário;\nb) Prestação de contas detalhada dos últimos 3 exercícios;\nc) Bloqueio de valores nas contas pessoais do reconvindo.",
      versoes: [
        {
          id: "VER-060", numero: 1, criadoEm: "2026-04-02T10:00:00-03:00", autor: "Mariana Couto",
          resumoMudancas: "Reconvenção com pedido de indenização e prestação de contas.",
          contextoVersaoOrigem: 1,
          conteudo: "RECONVENÇÃO...\n\nI. DA RECONVENÇÃO\n\nO reconvinte, Marcos Tanaka...",
        },
      ],
    },
    // MIN-008: Tutela de urgência — CAS-001
    {
      id: "MIN-2026-008",
      pedidoId: "PED-2026-011",
      titulo: "Minuta - Tutela de Urgência — Suspensão de Multas Contratuais",
      conteudoAtual:
        "EXCELENTÍSSIMO SENHOR DOUTOR JUIZ DE DIREITO\n\nATLAS ENGENHARIA S.A. vem requerer a concessão de TUTELA DE URGÊNCIA nos termos do artigo 300 do CPC.\n\nI. DO FUMUS BONI JURIS\n\nConforme demonstrado nos autos, a ré Delta Fornecimentos descumpriu reiteradamente o contrato de fornecimento, gerando multas indevidas contra a autora no valor de R$ 45.000/dia.\n\nII. DO PERICULUM IN MORA\n\nA manutenção das multas compromete o fluxo de caixa da autora de forma irreversível, com risco concreto de inadimplemento de obrigações financeiras junto a terceiros.\n\nIII. DOS PEDIDOS\n\na) Suspensão imediata da cobrança das multas contratuais;\nb) Determinação de abstenção de inclusão do nome da autora em cadastros restritivos.",
      versoes: [
        {
          id: "VER-070", numero: 1, criadoEm: "2026-04-01T18:00:00-03:00", autor: "Carlos Mendes",
          resumoMudancas: "Tutela de urgência com demonstração de fumus boni juris e periculum in mora.",
          contextoVersaoOrigem: 1,
          conteudo: "TUTELA DE URGÊNCIA...\n\nI. DO FUMUS BONI JURIS...",
        },
        {
          id: "VER-071", numero: 2, criadoEm: "2026-04-02T09:00:00-03:00", autor: "Carlos Mendes",
          resumoMudancas: "Adição do pedido de abstenção de cadastros restritivos.",
          contextoVersaoOrigem: 1,
          conteudo: "TUTELA DE URGÊNCIA...\n\nI. DO FUMUS BONI JURIS...\n\nIII. DOS PEDIDOS\n\na) Suspensão imediata da cobrança das multas;\nb) Determinação de abstenção de inclusão em cadastros restritivos.",
        },
      ],
    },
    // ──────────────────────────────────────────────────────────
    // MINUTAS AGRÁRIAS (MIN-009 a MIN-012)
    // ──────────────────────────────────────────────────────────
    // MIN-009: Usucapião Rural — PED-013
    {
      id: "MIN-009",
      pedidoId: "PED-2026-013",
      titulo: "Minuta — Usucapião Rural Pro Labore",
      conteudoAtual: "AO JUÍZO DA VARA CÍVEL E AGRÁRIA DE GOIÂNIA - GO\n\nJOSÉ ANTÔNIO DA SILVA, trabalhador rural... vem propor AÇÃO DE USUCAPIÃO ESPECIAL RURAL (PRO LABORE), com fulcro no art. 191 da CRFB e art. 1.239 do CC...\n\nI. DOS FATOS\nO Autor exerce posse mansa, pacífica e ininterrupta sobre parcela de 38 hectares da Fazenda São Jorge há mais de 12 anos, área outrora abandonada...\n\nII. DOS FUNDAMENTOS\nA propriedade não ultrapassa 50 hectares, é explorada mediante trabalho familiar do autor (cultivo de milho e soja) garantindo sua subsistência, preenchendo todos os requisitos constitucionais da usucapião rural especial.\n\nIII. DOS PEDIDOS\na) Citação dos confinantes e interessados;\nb) Declaração de domínio da área usucapienda...",
      versoes: [
        {
          id: "VER-080", numero: 1, criadoEm: "2026-04-02T14:00:00-03:00", autor: "Carlos Mendes",
          resumoMudancas: "Criação da minuta inicial de usucapião.",
          contextoVersaoOrigem: 1,
          conteudo: "AO JUÍZO DA VARA CÍVEL E AGRÁRIA DE GOIÂNIA - GO\n\nJOSÉ ANTÔNIO DA SILVA, trabalhador rural... vem propor AÇÃO DE USUCAPIÃO ESPECIAL RURAL (PRO LABORE), com fulcro no art. 191 da CRFB e art. 1.239 do CC...\n\nI. DOS FATOS\nO Autor exerce posse mansa, pacífica e ininterrupta sobre parcela de 38 hectares da Fazenda São Jorge há mais de 12 anos, área outrora abandonada...\n\nII. DOS FUNDAMENTOS\nA propriedade não ultrapassa 50 hectares, é explorada mediante trabalho familiar do autor (cultivo de milho e soja) garantindo sua subsistência, preenchendo todos os requisitos constitucionais da usucapião rural especial.\n\nIII. DOS PEDIDOS\na) Citação dos confinantes e interessados;\nb) Declaração de domínio da área usucapienda...",
        },
      ],
    },
    // MIN-010: Reintegração de Posse — PED-014
    {
      id: "MIN-010",
      pedidoId: "PED-2026-014",
      titulo: "Minuta — Reintegração de Posse Definitiva",
      conteudoAtual: "AO JUÍZO DA VARA AGRÁRIA DE MARABÁ - PA\n\nAÇÃO DE REINTEGRAÇÃO DE POSSE COM PEDIDO LIMINAR\n\nI. DOS FATOS\nInvasão ocorrida em 30/03/2026 (força nova) na área de reserva legal e pastagens, com derrubada de cercas e prejuízo de R$ 2,1M.\n\nII. DOS FUNDAMENTOS\nComprovada a posse pretérita (CAR e vistorias), o esbulho com menos de ano e dia e a perda da posse (art. 561 CPC).\n\nIII. DA LIMINAR E DA FORÇA POLICIAL\nRequer-se a expedição inaudita altera parte do mandado de reintegração e a requisição de força policial, dada a agressividade da turbação armada.\n\nIV. DOS PEDIDOS\na) Deferimento da liminar inaudita altera parte;\nb) Procedência total para reintegração definitiva e condenação em perdas e danos.",
      versoes: [
        {
          id: "VER-090", numero: 1, criadoEm: "2026-04-01T14:00:00-03:00", autor: "Gerador JGG",
          resumoMudancas: "Geração estruturada da inicial.",
          contextoVersaoOrigem: 1,
          conteudo: "AO JUÍZO DA VARA AGRÁRIA DE MARABÁ - PA\n\nAÇÃO DE REINTEGRAÇÃO DE POSSE COM PEDIDO LIMINAR\n\nI. DOS FATOS\nInvasão ocorrida em 30/03/2026 (força nova) na área de pastagem...",
        },
        {
          id: "VER-091", numero: 2, criadoEm: "2026-04-01T16:00:00-03:00", autor: "Gilberto Jacob",
          resumoMudancas: "Revisão e adição de pedido de força policial.",
          contextoVersaoOrigem: 1,
          conteudo: "AO JUÍZO DA VARA AGRÁRIA DE MARABÁ - PA\n\nAÇÃO DE REINTEGRAÇÃO DE POSSE COM PEDIDO LIMINAR\n\nI. DOS FATOS\nInvasão ocorrida em 30/03/2026 (força nova) na área de reserva legal e pastagens, com derrubada de cercas e prejuízo de R$ 2,1M.\n\nII. DOS FUNDAMENTOS\nComprovada a posse pretérita (CAR e vistorias), o esbulho com menos de ano e dia e a perda da posse (art. 561 CPC).\n\nIII. DA LIMINAR E DA FORÇA POLICIAL\nRequer-se a expedição inaudita altera parte do mandado de reintegração e a requisição de força policial, dada a agressividade da turbação armada.\n\nIV. DOS PEDIDOS\na) Deferimento da liminar inaudita altera parte;\nb) Procedência total para reintegração definitiva e condenação em perdas e danos.",
        },
      ],
    },
    // MIN-011: Renovatória de Arrendamento — PED-015
    {
      id: "MIN-011",
      pedidoId: "PED-2026-015",
      titulo: "Minuta — Ação Renovatória de Arrendamento",
      conteudoAtual: "AÇÃO RENOVATÓRIA DE ARRENDAMENTO RURAL C/C DIREITO DE RETENÇÃO\n\nI. DOS FATOS\nArrendamento de 2.400 ha de soja/milho há 8 anos ininterruptos. Em 10/01/2026, fora do prazo semestral do art. 95, IV do Estatuto da Terra, o arrendador enviou notificação vazia de retomada.\n\nII. DO DIREITO\nA notificação denotou vícios formais, pois não apontou proposta concreta de terceiro nem justificativa real para exploração direta (art. 95, V, do ET). Mais que isso, há direito de retenção pelas benfeitorias construídas (R$ 1,8M) com expresso consentimento...\n\nIII. DOS PEDIDOS\na) Declaração de ineficácia da notificação premonitória;\nb) Renovação compulsória por igual período (3 anos);\nc) Sucessivamente, o exercício do direito de retenção do imóvel até indenização integral das benfeitorias.",
      versoes: [
        {
          id: "VER-100", numero: 1, criadoEm: "2026-04-02T11:00:00-03:00", autor: "Mariana Couto",
          resumoMudancas: "Rascunho de fundamentação vinculada ao Estatuto da Terra.",
          contextoVersaoOrigem: 1,
          conteudo: "AÇÃO RENOVATÓRIA DE ARRENDAMENTO RURAL C/C DIREITO DE RETENÇÃO\n\nI. DOS FATOS\nArrendamento de 2.400 ha de soja/milho há 8 anos ininterruptos. Em 10/01/2026, fora do prazo semestral do art. 95, IV do Estatuto da Terra, o arrendador enviou notificação vazia de retomada.\n\nII. DO DIREITO\nA notificação denotou vícios formais, pois não apontou proposta concreta de terceiro nem justificativa real para exploração direta (art. 95, V, do ET). Mais que isso, há direito de retenção pelas benfeitorias construídas (R$ 1,8M) com expresso consentimento...\n\nIII. DOS PEDIDOS\na) Declaração de ineficácia da notificação premonitória;\nb) Renovação compulsória por igual período (3 anos);\nc) Sucessivamente, o exercício do direito de retenção do imóvel até indenização integral das benfeitorias.",
        },
      ],
    },
    // MIN-012: Execução de CPR — PED-016
    {
      id: "MIN-012",
      pedidoId: "PED-2026-016",
      titulo: "Minuta — Execução de CPR com Arresto",
      conteudoAtual: "AO JUÍZO CÍVEL DA COMARCA DE CASCAVEL - PR\n\nAÇÃO DE EXECUÇÃO DE TÍTULO EXTRAJUDICIAL (CPR FINANCEIRA)\n\nI. DOS FATOS E DO TÍTULO\nA Cooperativa Exequente é endossatária de Cédula de Produto Rural Financeira nº 1092/2025, emitida pela Fazenda Monte Alegre Ltda, perfazendo dívida líquida, certa e exigível de R$ 5.600.000,00 com vencimento em 15/03/2026.\n\nII. DO DIREITO\nA Lei da CPR conferiu-lhe plena executoriedade (Lei 8.929/94). Esgotadas as tratativas, requer a execução forçada da quantia pactuada.\n\nIII. DA TUTELA CAUTELAR DE ARRESTO\nHá claro risco de dissipação patrimonial, considerando desvio de grãos em armazéns de terceiros, requerendo-se arresto da soja depositada no silo X.\n\nIV. DOS PEDIDOS\na) Arresto tutelar;\nb) Citação em 3 dias para pagamento, sob pena de penhora e bloqueio SisbaJud.",
      versoes: [
        {
          id: "VER-110", numero: 1, criadoEm: "2026-04-02T09:00:00-03:00", autor: "Carlos Mendes",
          resumoMudancas: "Inicial de execução gerada visando patrimônio específico.",
          contextoVersaoOrigem: 1,
          conteudo: "AO JUÍZO CÍVEL DA COMARCA DE CASCAVEL - PR\n\nAÇÃO DE EXECUÇÃO DE TÍTULO EXTRAJUDICIAL (CPR FINANCEIRA)\n\nI. DOS FATOS E DO TÍTULO\nA Cooperativa Exequente é endossatária de Cédula de Produto Rural Financeira nº 1092/2025, emitida pela Fazenda Monte Alegre Ltda, perfazendo dívida líquida, certa e exigível de R$ 5.600.000,00 com vencimento em 15/03/2026.\n\nII. DO DIREITO\nA Lei da CPR conferiu-lhe plena executoriedade (Lei 8.929/94). Esgotadas as tratativas, requer a execução forçada da quantia pactuada.\n\nIII. DA TUTELA CAUTELAR DE ARRESTO\nHá claro risco de dissipação patrimonial, considerando desvio de grãos em armazéns de terceiros, requerendo-se arresto da soja depositada no silo X.\n\nIV. DOS PEDIDOS\na) Arresto tutelar;\nb) Citação em 3 dias para pagamento, sob pena de penhora e bloqueio SisbaJud.",
        },
      ],
    },
    // MIN-013: Exceção de pré-executividade — PED-019
    {
      id: "MIN-013",
      pedidoId: "PED-2026-019",
      titulo: "Minuta — Exceção de Pré-Executividade (Impenhorabilidade)",
      conteudoAtual: "AO JUÍZO DA VARA CÍVEL DA COMARCA DE VACARIA - RS\n\nProcesso nº 0000000-00.2026.8.21.0000\n\nJOÃO BATISTA SOUZA, produtor rural... vem apresentar EXCEÇÃO DE PRÉ-EXECUTIVIDADE, em face da Execução interposta pelo BANCO SAFRA S.A...\n\nI. DO CABIMENTO\nA impenhorabilidade de bem de família e da pequena propriedade rural envolve matéria de ordem pública, passível de arguição por simples petição.\n\nII. DOS FATOS\nEm 01/04/2026, houve a lavratura do termo de penhora sobre o imóvel de matrícula 12.345, de área 2,5 módulos fiscais, única propriedade e local de moradia da família.\n\nIII. DOS FUNDAMENTOS: IMPENHORABILIDADE ABSOLUTA\nO art. 5º, XXVI, da CF c/c art. 833, VIII do CPC amparam a pequena propriedade rural explorada pela família. Documenta-se o trabalho direto e de subsistência via notas fiscais e DIPJ...\n\nIV. DOS PEDIDOS\na) Recebimento e suspensão dos atos expropriatórios;\nb) Decretação de nulidade processual da penhora, liberando-se o imóvel constrito.",
      versoes: [
        {
          id: "VER-120", numero: 1, criadoEm: "2026-04-02T16:30:00-03:00", autor: "Thiago Martins",
          resumoMudancas: "Geração da Exceção com teses constitucionais trabalhadas.",
          contextoVersaoOrigem: 1,
          conteudo: "AO JUÍZO DA VARA CÍVEL DA COMARCA DE VACARIA - RS\n\nProcesso nº 0000000-00.2026.8.21.0000\n\nJOÃO BATISTA SOUZA, produtor rural... vem apresentar EXCEÇÃO DE PRÉ-EXECUTIVIDADE, em face da Execução interposta pelo BANCO SAFRA S.A...\n\nI. DO CABIMENTO\nA impenhorabilidade de bem de família e da pequena propriedade rural envolve matéria de ordem pública, passível de arguição por simples petição.\n\nII. DOS FATOS\nEm 01/04/2026, houve a lavratura do termo de penhora sobre o imóvel de matrícula 12.345, de área 2,5 módulos fiscais, única propriedade e local de moradia da família.\n\nIII. DOS FUNDAMENTOS: IMPENHORABILIDADE ABSOLUTA\nO art. 5º, XXVI, da CF c/c art. 833, VIII do CPC amparam a pequena propriedade rural explorada pela família. Documenta-se o trabalho direto e de subsistência via notas fiscais e DIPJ...\n\nIV. DOS PEDIDOS\na) Recebimento e suspensão dos atos expropriatórios;\nb) Decretação de nulidade processual da penhora, liberando-se o imóvel constrito.",
        },
      ],
    },
    // MIN-014: Mandado de Segurança — PED-020
    {
      id: "MIN-014",
      pedidoId: "PED-2026-020",
      titulo: "Minuta — Mandado de Segurança (Prorrogação Rural)",
      conteudoAtual: "EXMO. SR. JUIZ FEDERAL DA SEÇÃO JUDICIÁRIA DO MATO GROSSO\n\nFAZENDA RIO DOURADO LTDA... impetra MANDADO DE SEGURANÇA COM PEDIDO LIMINAR contra ato ilegal praticado pelo Gerente Geral do Banco da Amazônia...\n\nI. DO CABIMENTO\nAutoridade equiparada em delegação de função da União (crédito rural subsidiado).\n\nII. DOS FATOS\nHouve frustração de 52% da safra por intercorrências climáticas. O credor negou alongamento da dívida exigindo amortizações descabidas.\n\nIII. DO DIREITO LÍQUIDO E CERTO (SÚMULA 298/STJ)\n\"O alongamento de dívida originada de crédito rural não constitui faculdade da instituição financeira, mas direito do devedor nos termos da lei.\"\n\nIV. DA LIMINAR E DOS PEDIDOS\na) Liminar inaudita altera parte para suspender a exigibilidade do crédito;\nb) Concessão da segurança confirmando a prorrogação no cronograma do MCR.",
      versoes: [
        {
          id: "VER-130", numero: 1, criadoEm: "2026-04-02T17:30:00-03:00", autor: "Mariana Couto",
          resumoMudancas: "Rascunho do Mandado de Segurança com foco no direito potestativo.",
          contextoVersaoOrigem: 1,
          conteudo: "EXMO. SR. JUIZ FEDERAL DA SEÇÃO JUDICIÁRIA DO MATO GROSSO\n\nFAZENDA RIO DOURADO LTDA... impetra MANDADO DE SEGURANÇA COM PEDIDO LIMINAR contra ato ilegal praticado pelo Gerente Geral do Banco da Amazônia...\n\nI. DO CABIMENTO\nAutoridade equiparada em delegação de função da União (crédito rural subsidiado).\n\nII. DOS FATOS\nHouve frustração de 52% da safra por intercorrências climáticas. O credor negou alongamento da dívida exigindo amortizações descabidas.\n\nIII. DO DIREITO LÍQUIDO E CERTO (SÚMULA 298/STJ)\n\"O alongamento de dívida originada de crédito rural não constitui faculdade da instituição financeira, mas direito do devedor nos termos da lei.\"\n\nIV. DA LIMINAR E DOS PEDIDOS\na) Liminar inaudita altera parte para suspender a exigibilidade do crédito;\nb) Concessão da segurança confirmando a prorrogação no cronograma do MCR.",
        },
      ],
    },
  ];

  async listarPedidos(): Promise<PedidoDePeca[]> {
    return Promise.resolve(this.pedidos);
  }

  async obterPedidoPorId(pedidoId: string): Promise<PedidoDePeca | undefined> {
    return Promise.resolve(this.pedidos.find((pedido) => pedido.id === pedidoId));
  }

  async listarEtapasPipeline(): Promise<EtapaPipelineInfo[]> {
    return Promise.resolve(this.etapas);
  }

  async listarHistoricoPipeline(pedidoId: string): Promise<HistoricoPipeline[]> {
    return Promise.resolve(this.historicoPorPedido[pedidoId] ?? []);
  }

  async obterMinutaPorId(minutaId: string): Promise<Minuta | undefined> {
    return Promise.resolve(this.minutas.find((minuta) => minuta.id === minutaId));
  }

  async obterMinutaPorPedidoId(pedidoId: string): Promise<Minuta | undefined> {
    return Promise.resolve(this.minutas.find((minuta) => minuta.pedidoId === pedidoId));
  }

  async simularCriacaoPedido(payload: NovoPedidoPayload): Promise<PedidoDePeca> {
    const novoId = `PED-MOCK-${Math.floor(Math.random() * 9000) + 1000}`;

    return Promise.resolve({
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
    });
  }

  async listarTiposPeca(): Promise<TipoPeca[]> {
    return Promise.resolve([...TODOS_TIPOS_PECA]);
  }
}
