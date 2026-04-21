import type { Caso } from "@/modules/casos/domain/types";
import type { AtualizarCasoPayload, CasosRepository, NovoCasoPayload } from "@/modules/casos/application/contracts";

export class MockCasosRepository implements CasosRepository {
  private readonly casos: Caso[] = [
    // ─── 1. Cível Empresarial ───────────────────────────────
    {
      id: "CAS-2026-001",
      titulo: "Ação de Rescisão Contratual com Pedido Liminar",
      cliente: "Atlas Engenharia S.A.",
      materia: "Cível Empresarial",
      tribunal: "TJSP",
      status: "estratégia",
      prazoFinal: "2026-04-09",
      resumo:
        "Discussão sobre inadimplemento contratual com solicitação de tutela de urgência para suspensão de multas contratuais de R$ 45.000/dia.",
      partes: [
        { nome: "Atlas Engenharia S.A.", papel: "autor" },
        { nome: "Delta Fornecimentos Ltda.", papel: "réu" },
      ],
      documentosRelacionados: ["DOC-001", "DOC-002", "DOC-003"],
      eventos: [
        { id: "EV-001", data: "2026-03-30T09:20:00-03:00", descricao: "Classificação inicial do caso concluída." },
        { id: "EV-002", data: "2026-04-01T14:00:00-03:00", descricao: "Extração de fatos relevantes validada pelo coordenador." },
        { id: "EV-003", data: "2026-04-02T11:30:00-03:00", descricao: "Estratégia jurídica preliminar aprovada pela direção." },
      ],
    },
    // ─── 2. Trabalhista ─────────────────────────────────────
    {
      id: "CAS-2026-002",
      titulo: "Contestação Trabalhista - Horas Extras e Adicional Noturno",
      cliente: "Rede Supernova Comércio",
      materia: "Trabalhista",
      tribunal: "TRT-2",
      status: "minuta em elaboração",
      prazoFinal: "2026-04-05",
      resumo:
        "Defesa em reclamação trabalhista sobre horas extras, adicional noturno e reflexos. Foco na prova documental de jornada e registros de ponto eletrônico.",
      partes: [
        { nome: "Thiago Alves", papel: "autor" },
        { nome: "Rede Supernova Comércio", papel: "réu" },
      ],
      documentosRelacionados: ["DOC-004", "DOC-005", "DOC-015"],
      eventos: [
        { id: "EV-004", data: "2026-03-28T10:00:00-03:00", descricao: "Leitura documental concluída com checklist interno." },
        { id: "EV-005", data: "2026-04-01T16:00:00-03:00", descricao: "Contestação em fase de redação." },
      ],
    },
    // ─── 3. Tributário ──────────────────────────────────────
    {
      id: "CAS-2026-003",
      titulo: "Mandado de Segurança Tributário - ICMS sobre Transferências",
      cliente: "Horizonte Logística Ltda.",
      materia: "Tributário",
      tribunal: "TRF-3",
      status: "em análise",
      prazoFinal: "2026-04-15",
      resumo:
        "Impetração de mandado de segurança para suspensão da exigibilidade de ICMS sobre transferências interestaduais entre filiais, com base no Tema 1099 do STF.",
      partes: [
        { nome: "Horizonte Logística Ltda.", papel: "autor" },
        { nome: "Fazenda Pública do Estado de São Paulo", papel: "réu" },
      ],
      documentosRelacionados: ["DOC-006", "DOC-016", "DOC-017"],
      eventos: [
        { id: "EV-006", data: "2026-04-01T08:45:00-03:00", descricao: "Caso recebido e classificado como prioridade média." },
        { id: "EV-007", data: "2026-04-02T10:00:00-03:00", descricao: "Análise da jurisprudência do STF em andamento." },
      ],
    },
    // ─── 4. Consumidor ──────────────────────────────────────
    {
      id: "CAS-2026-004",
      titulo: "Ação Indenizatória por Falha em Produto - Recall",
      cliente: "Marina Cavalcanti",
      materia: "Consumidor",
      tribunal: "TJSP",
      status: "novo",
      prazoFinal: "2026-04-20",
      resumo:
        "Consumidora adquiriu veículo zero-quilômetro com defeito estrutural no sistema de freios. Fabricante realizou recall tardio após acidente leve. Pedido de danos materiais e morais.",
      partes: [
        { nome: "Marina Cavalcanti", papel: "autor" },
        { nome: "AutoBrasil Montadora S.A.", papel: "réu" },
      ],
      documentosRelacionados: ["DOC-007", "DOC-008"],
      eventos: [
        { id: "EV-008", data: "2026-04-02T09:00:00-03:00", descricao: "Caso recebido via formulário online." },
      ],
    },
    // ─── 5. Família / Alimentos ─────────────────────────────
    {
      id: "CAS-2026-005",
      titulo: "Revisional de Alimentos com Pedido de Tutela",
      cliente: "Roberto Mendes",
      materia: "Família",
      tribunal: "TJSP",
      status: "estratégia",
      prazoFinal: "2026-04-12",
      resumo:
        "Cliente perdeu emprego formal e busca redução provisória da pensão alimentícia de 30% para 20% do salário mínimo. Ex-cônjuge contesta alegando gastos extraordinários com saúde do menor.",
      partes: [
        { nome: "Roberto Mendes", papel: "autor" },
        { nome: "Fernanda Oliveira", papel: "réu" },
        { nome: "Lucas Mendes (menor)", papel: "terceiro" },
      ],
      documentosRelacionados: ["DOC-009", "DOC-010", "DOC-018"],
      eventos: [
        { id: "EV-009", data: "2026-03-29T14:00:00-03:00", descricao: "Documentação de renda atualizada recebida." },
        { id: "EV-010", data: "2026-04-01T09:30:00-03:00", descricao: "Estratégia de tutela antecipada em análise." },
      ],
    },
    // ─── 6. Criminal / Habeas Corpus ────────────────────────
    {
      id: "CAS-2026-006",
      titulo: "Habeas Corpus - Prisão Preventiva Desproporcional",
      cliente: "André Luís Ferreira",
      materia: "Criminal",
      tribunal: "TJSP",
      status: "em análise",
      prazoFinal: "2026-04-04",
      resumo:
        "Impetração de HC para revogar prisão preventiva em caso de furto simples sem violência. Réu é primário, tem residência fixa e emprego formal. Desproporcionalidade da medida restritiva.",
      partes: [
        { nome: "André Luís Ferreira", papel: "autor" },
        { nome: "Ministério Público do Estado de São Paulo", papel: "réu" },
      ],
      documentosRelacionados: ["DOC-011", "DOC-019"],
      eventos: [
        { id: "EV-011", data: "2026-04-02T07:30:00-03:00", descricao: "URGENTE: HC protocolado com pedido liminar." },
        { id: "EV-012", data: "2026-04-02T15:00:00-03:00", descricao: "Informações do juízo de origem solicitadas." },
      ],
    },
    // ─── 7. Empresarial / Societário ────────────────────────
    {
      id: "CAS-2026-007",
      titulo: "Dissolução Parcial de Sociedade Limitada",
      cliente: "Marcos Tanaka",
      materia: "Empresarial",
      tribunal: "TJSP",
      status: "minuta em elaboração",
      prazoFinal: "2026-04-18",
      resumo:
        "Sócio minoritário (35%) busca dissolução parcial e apuração de haveres. Alegação de exclusão de fato das deliberações societárias e distribuição irregular de lucros.",
      partes: [
        { nome: "Marcos Tanaka", papel: "autor" },
        { nome: "Nexus Tecnologia Ltda.", papel: "réu" },
        { nome: "Felipe Nogueira (sócio majoritário)", papel: "réu" },
      ],
      documentosRelacionados: ["DOC-012", "DOC-013", "DOC-020"],
      eventos: [
        { id: "EV-013", data: "2026-03-25T10:00:00-03:00", descricao: "Reunião inicial com cliente - levantamento de fatos." },
        { id: "EV-014", data: "2026-04-01T11:00:00-03:00", descricao: "Análise do contrato social e alterações contratuais." },
        { id: "EV-015", data: "2026-04-02T16:00:00-03:00", descricao: "Petição inicial em fase de redação." },
      ],
    },
    // ─── 8. Bancário ────────────────────────────────────────
    {
      id: "CAS-2026-008",
      titulo: "Revisional de Contrato Bancário - Juros Abusivos",
      cliente: "Construtora Meridiano Ltda.",
      materia: "Bancário",
      tribunal: "TJSP",
      status: "em análise",
      prazoFinal: "2026-04-22",
      resumo:
        "Revisão de contrato de financiamento empresarial com juros compostos acima da taxa média do BACEN. Capital de giro de R$ 2,8 milhões com taxa de 4,2% a.m. vs média de 1,8% a.m.",
      partes: [
        { nome: "Construtora Meridiano Ltda.", papel: "autor" },
        { nome: "Banco Nacional S.A.", papel: "réu" },
      ],
      documentosRelacionados: ["DOC-014", "DOC-021"],
      eventos: [
        { id: "EV-016", data: "2026-04-01T14:30:00-03:00", descricao: "Contrato bancário recebido para análise." },
        { id: "EV-017", data: "2026-04-02T10:30:00-03:00", descricao: "Laudo comparativo com taxa média BACEN em elaboração." },
      ],
    },
    // ─── 9. Ambiental ───────────────────────────────────────
    {
      id: "CAS-2026-009",
      titulo: "Defesa em Auto de Infração Ambiental - IBAMA",
      cliente: "AgroBrasil Cooperativa",
      materia: "Ambiental",
      tribunal: "TRF-3",
      status: "novo",
      prazoFinal: "2026-04-25",
      resumo:
        "Defesa administrativa contra auto de infração do IBAMA por supressão de vegetação em APP. Cliente alega que área estava degradada e a supressão foi autorizada pelo órgão estadual.",
      partes: [
        { nome: "AgroBrasil Cooperativa", papel: "autor" },
        { nome: "IBAMA", papel: "réu" },
      ],
      documentosRelacionados: ["DOC-022", "DOC-023"],
      eventos: [
        { id: "EV-018", data: "2026-04-02T08:00:00-03:00", descricao: "Auto de infração recebido para análise." },
      ],
    },
    // ─── 10. Agrário / Agronegócio — Embargos CPR ───────────
    {
      id: "CAS-2026-010",
      titulo: "Embargos à Execução - Dívida Rural (CPR)",
      cliente: "Fazenda Santa Clara",
      materia: "Agrário / Agronegócio",
      tribunal: "TJMT",
      status: "estratégia",
      prazoFinal: "2026-04-10",
      resumo:
        "Embargos à execução de Cédula de Produto Rural (CPR) de R$ 3,2 milhões. Defesa baseada em caso fortuito (seca extrema) que impossibilitou a entrega do produto no prazo. Laudo INMET comprova pluviometria 73% abaixo da média.",
      partes: [
        { nome: "Fazenda Santa Clara", papel: "autor" },
        { nome: "Trading Grãos International S.A.", papel: "réu" },
      ],
      documentosRelacionados: ["DOC-024", "DOC-025", "DOC-026"],
      eventos: [
        { id: "EV-019", data: "2026-03-27T10:00:00-03:00", descricao: "Caso recebido com urgência - prazo de embargos correndo." },
        { id: "EV-020", data: "2026-04-01T09:00:00-03:00", descricao: "Laudo agronômico de seca solicitado ao perito." },
        { id: "EV-021", data: "2026-04-02T14:00:00-03:00", descricao: "Estratégia de embargos definida com apoio em jurisprudência do STJ." },
      ],
    },
    // ─── 11. Agrário — Usucapião Rural (Pró-labore) ─────────
    {
      id: "CAS-2026-011",
      titulo: "Usucapião Rural (Pro Labore) - Pequeno Produtor",
      cliente: "José Antônio da Silva",
      materia: "Agrário / Agronegócio",
      tribunal: "TJGO",
      status: "em análise",
      prazoFinal: "2026-05-20",
      resumo:
        "Produtor rural familiar ocupa área de 38 hectares há mais de 12 anos, sem oposição, com produção contínua de milho e soja. Imóvel registrado em nome de espólio não inventariado. Pedido de usucapião constitucional rural (art. 191 CF e art. 1.239 CC).",
      partes: [
        { nome: "José Antônio da Silva", papel: "autor" },
        { nome: "Espólio de Geraldo Souza (vários herdeiros)", papel: "réu" },
      ],
      documentosRelacionados: ["DOC-030", "DOC-031", "DOC-032", "DOC-033"],
      eventos: [
        { id: "EV-030", data: "2026-03-15T09:00:00-03:00", descricao: "Documentação fundiária e declarações de confrontantes coletadas." },
        { id: "EV-031", data: "2026-03-25T14:00:00-03:00", descricao: "Levantamento topográfico e memorial descritivo em elaboração." },
        { id: "EV-032", data: "2026-04-01T10:00:00-03:00", descricao: "Comprovantes de produção agrícola dos últimos 5 anos organizados." },
        { id: "EV-033", data: "2026-04-02T16:00:00-03:00", descricao: "Análise da cadeia dominial concluída — imóvel sem matrícula atualizada." },
      ],
    },
    // ─── 12. Agrário — Arrendamento Rural ────────────────────
    {
      id: "CAS-2026-012",
      titulo: "Renovatória de Arrendamento Rural - Fazenda Boa Vista",
      cliente: "Agropecuária Três Irmãos Ltda.",
      materia: "Agrário / Agronegócio",
      tribunal: "TJMS",
      status: "minuta em elaboração",
      prazoFinal: "2026-04-30",
      resumo:
        "Arrendatário rural pleiteia renovação judicial de contrato de arrendamento de 2.400 hectares para cultivo de soja e milho. Proprietário pretende retomar o imóvel para exploração própria. Contrato vigente há 8 anos com benfeitorias de R$ 1,8 milhão realizadas pelo arrendatário.",
      partes: [
        { nome: "Agropecuária Três Irmãos Ltda.", papel: "autor" },
        { nome: "Eduardo Campos Neto", papel: "réu" },
      ],
      documentosRelacionados: ["DOC-034", "DOC-035", "DOC-036"],
      eventos: [
        { id: "EV-034", data: "2026-03-20T10:00:00-03:00", descricao: "Contrato de arrendamento e termos aditivos analisados." },
        { id: "EV-035", data: "2026-03-28T14:00:00-03:00", descricao: "Levantamento de benfeitorias com laudo pericial em andamento." },
        { id: "EV-036", data: "2026-04-02T09:00:00-03:00", descricao: "Estratégia baseada no Estatuto da Terra e direito de preferência." },
      ],
    },
    // ─── 13. Agrário — Execução de CPR (lado credor) ────────
    {
      id: "CAS-2026-013",
      titulo: "Execução de CPR Financeira - Inadimplemento de Produtor",
      cliente: "Cooperativa AgroSul",
      materia: "Agrário / Agronegócio",
      tribunal: "TJPR",
      status: "em análise",
      prazoFinal: "2026-04-18",
      resumo:
        "Execução de Cédula de Produto Rural Financeira (CPR-F) no valor de R$ 5,6 milhões. Produtor rural inadimpliu obrigação de entrega de 12.000 sacas de soja na safra 2025/2026. Cooperativa busca penhora de safra futura e bens do devedor.",
      partes: [
        { nome: "Cooperativa AgroSul", papel: "autor" },
        { nome: "Fazenda Monte Alegre Ltda.", papel: "réu" },
      ],
      documentosRelacionados: ["DOC-037", "DOC-038", "DOC-039"],
      eventos: [
        { id: "EV-037", data: "2026-03-22T08:00:00-03:00", descricao: "CPR-F original e endossos analisados — título executivo extrajudicial válido." },
        { id: "EV-038", data: "2026-04-01T11:00:00-03:00", descricao: "Pesquisa de bens do devedor em andamento (RENAJUD, SISBAJUD, CNIB)." },
        { id: "EV-039", data: "2026-04-02T15:00:00-03:00", descricao: "Pedido de penhora de safra futura em elaboração." },
      ],
    },
    // ─── 14. Agrário — Ação Possessória Rural ────────────────
    {
      id: "CAS-2026-014",
      titulo: "Reintegração de Posse - Invasão de Propriedade Rural",
      cliente: "Fazenda Ribeirão Grande",
      materia: "Agrário / Agronegócio",
      tribunal: "TJPA",
      status: "estratégia",
      prazoFinal: "2026-04-08",
      resumo:
        "Reintegração de posse de área de 850 hectares invadida por grupo organizado. Invasores destruíram cercas, montaram acampamento e impedem acesso à área de pastagem. Prejuízo estimado em R$ 2,1 milhões com perda de gado e destruição de infraestrutura.",
      partes: [
        { nome: "Fazenda Ribeirão Grande", papel: "autor" },
        { nome: "Sem identificação (grupo invasor)", papel: "réu" },
      ],
      documentosRelacionados: ["DOC-040", "DOC-041", "DOC-042", "DOC-043"],
      eventos: [
        { id: "EV-040", data: "2026-04-01T06:30:00-03:00", descricao: "URGENTE: Invasão comunicada ao escritório — BO registrado." },
        { id: "EV-041", data: "2026-04-01T10:00:00-03:00", descricao: "Documentação registral e imagens aéreas de drone coletadas." },
        { id: "EV-042", data: "2026-04-01T15:00:00-03:00", descricao: "Liminar de reintegração protocolada com pedido de força policial." },
        { id: "EV-043", data: "2026-04-02T08:00:00-03:00", descricao: "Juízo designou audiência de justificação para 03/04/2026." },
      ],
    },
    // ─── 15. Agrário — Revisional de Crédito Rural ──────────
    {
      id: "CAS-2026-015",
      titulo: "Revisional de Contrato de Crédito Rural - Custeio Agrícola",
      cliente: "Grupo Agrícola Cerrado S.A.",
      materia: "Agrário / Agronegócio",
      tribunal: "TJGO",
      status: "novo",
      prazoFinal: "2026-05-10",
      resumo:
        "Revisão de contrato de custeio agrícola de R$ 8,2 milhões junto ao Banco do Brasil. Produtor alega cobrança de encargos acima dos limites do Manual de Crédito Rural (MCR) do BACEN, capitalização indevida de juros e cobrança de comissão de permanência cumulada com correção monetária.",
      partes: [
        { nome: "Grupo Agrícola Cerrado S.A.", papel: "autor" },
        { nome: "Banco do Brasil S.A.", papel: "réu" },
      ],
      documentosRelacionados: ["DOC-044", "DOC-045", "DOC-046"],
      eventos: [
        { id: "EV-044", data: "2026-04-02T10:00:00-03:00", descricao: "Contrato de custeio e evolução do saldo devedor recebidos." },
        { id: "EV-045", data: "2026-04-02T16:00:00-03:00", descricao: "Análise preliminar identifica taxa efetiva 40% acima do MCR." },
      ],
    },
    // ─── 16. Agrário — Impenhorabilidade ───────────────────
    {
      id: "CAS-2026-016",
      titulo: "Exceção de Pré-Executividade - Impenhorabilidade Rural",
      cliente: "João Batista Souza",
      materia: "Agrário / Agronegócio",
      tribunal: "TJRS",
      status: "em análise",
      prazoFinal: "2026-04-12",
      resumo:
        "O exequente penhorou imóvel rural de 2 módulos fiscais do pequeno produtor. A alegação de defesa, via Exceção de Pré-Executividade, é a impenhorabilidade absoluta da pequena propriedade rural (Constituição), pois é trabalhada pela família e garante sua subsistência.",
      partes: [
        { nome: "João Batista Souza", papel: "réu" },
        { nome: "Banco Safra S.A.", papel: "autor" },
      ],
      documentosRelacionados: ["DOC-047", "DOC-048"],
      eventos: [
        { id: "EV-046", data: "2026-04-02T11:00:00-03:00", descricao: "Mandado de penhora recebido. Área de 2,5 módulos fiscais." },
        { id: "EV-047", data: "2026-04-02T16:30:00-03:00", descricao: "Notas fiscais e declaração de sindicato rural obtidas para comprovar trabalho familiar." },
      ],
    },
    // ─── 17. Agrário — Prorrogação / Securitização (MS) ────
    {
      id: "CAS-2026-017",
      titulo: "Mandado de Segurança - Prorrogação de Débito Rural (Súmula 298)",
      cliente: "Fazenda Rio Dourado",
      materia: "Agrário / Agronegócio",
      tribunal: "TRF-1",
      status: "estratégia",
      prazoFinal: "2026-04-14",
      resumo:
        "O produtor pleiteou administrativamente a prorrogação do débito rural (custeio) devido à quebra de safra por intempéries climáticas, preenchendo os requisitos do Manual de Crédito Rural. O banco gestor vinculou a renovação ilegalmente, ferindo a Súmula 298 do STJ. Cabível Mandado de Segurança.",
      partes: [
        { nome: "Fazenda Rio Dourado", papel: "autor" },
        { nome: "Gerente Geral do Banco da Amazônia", papel: "réu" },
      ],
      documentosRelacionados: ["DOC-049", "DOC-050", "DOC-051"],
      eventos: [
        { id: "EV-048", data: "2026-04-01T09:00:00-03:00", descricao: "Requerimento administrativo negado pelo banco." },
        { id: "EV-049", data: "2026-04-02T14:00:00-03:00", descricao: "Laudos agronômicos confirmam perda de mais de 50% da safra." },
      ],
    },
  ];

  async listarCasos(): Promise<Caso[]> {
    return Promise.resolve(this.casos);
  }

  async obterCasoPorId(casoId: string): Promise<Caso | undefined> {
    const caso = this.casos.find((caso) => caso.id === casoId);
    return Promise.resolve(caso);
  }

  async criarCaso(payload: NovoCasoPayload): Promise<Caso> {
    const novoCasoId = `CAS-MOCK-${Date.now()}`;
    const novo: Caso = {
      id: novoCasoId,
      titulo: payload.titulo,
      cliente: payload.cliente,
      materia: payload.materia,
      tribunal: payload.tribunal ?? "",
      status: "novo",
      prazoFinal: payload.prazoFinal ?? "",
      resumo: payload.resumo ?? "",
      partes: payload.partes ?? [],
      documentosRelacionados: [],
      eventos: [],
    };
    this.casos.push(novo);
    return Promise.resolve(novo);
  }

  async atualizarCaso(casoId: string, payload: AtualizarCasoPayload): Promise<Caso> {
    const index = this.casos.findIndex((c) => c.id === casoId);
    if (index === -1) throw new Error(`Caso ${casoId} não encontrado.`);
    const existing = this.casos[index];
    const atualizado: Caso = {
      ...existing,
      titulo: payload.titulo ?? existing.titulo,
      cliente: payload.cliente ?? existing.cliente,
      materia: payload.materia ?? existing.materia,
      tribunal: payload.tribunal ?? existing.tribunal,
      prazoFinal: payload.prazoFinal ?? existing.prazoFinal,
      resumo: payload.resumo ?? existing.resumo,
      status: payload.status ?? existing.status,
      partes: payload.partes ?? existing.partes,
    };
    this.casos[index] = atualizado;
    return Promise.resolve(atualizado);
  }

  async excluirCaso(casoId: string): Promise<void> {
    const index = this.casos.findIndex((c) => c.id === casoId);
    if (index === -1) throw new Error(`Caso ${casoId} não encontrado.`);
    this.casos.splice(index, 1);
  }
}
