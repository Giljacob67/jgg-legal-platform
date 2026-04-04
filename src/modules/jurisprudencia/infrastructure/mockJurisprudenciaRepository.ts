import type { Jurisprudencia, TipoDecisao } from "../domain/types";

const JD_MOCK: Jurisprudencia[] = [
  {
    id: "JD-001",
    titulo: "REsp 1.857.852/MT — Impenhorabilidade da pequena propriedade rural",
    ementa: "PROCESSUAL CIVIL. RECURSO ESPECIAL. EXECUÇÃO. PEQUENA PROPRIEDADE RURAL. IMPENHORABILIDADE. ART. 5º, XXVI, CF/88. REQUISITOS. TRABALHO FAMILIAR. 1. A impenhorabilidade da pequena propriedade rural, prevista no art. 5º, XXVI, da Constituição Federal, pressupõe que o imóvel seja trabalhado pela família do devedor. 2. A proteção constitucional independe da existência de débito derivado de sua atividade produtiva, abarcando também dívidas de origem diversa. 3. Recurso especial provido.",
    ementaResumida: "A pequena propriedade rural trabalhada pela família é impenhorável, inclusive para dívidas não vinculadas à atividade agrícola.",
    tribunal: "STJ",
    relator: "Min. Marco Buzzi",
    dataJulgamento: "2021-08-24",
    tipo: "acordao",
    materias: ["direito agrário", "impenhorabilidade", "pequena propriedade rural", "execução"],
    tese: "A impenhorabilidade da pequena propriedade rural (art. 5º, XXVI, CF/88) é ampla e independe da natureza da dívida, desde que o imóvel seja trabalhado pela família.",
    fundamentosLegais: ["Art. 5º, XXVI, CF/88", "Art. 833, VIII, CPC", "Lei n.º 8.009/90", "Estatuto da Terra"],
    urlOrigem: "https://stj.jusbrasil.com.br/jurisprudencia/1857852",
    relevancia: 5,
    criadoEm: "2026-01-10T10:00:00Z",
  },
  {
    id: "JD-002",
    titulo: "Tema 1099 STJ — Prorrogação automática de contratos de crédito rural",
    ementa: "DIREITO BANCÁRIO E AGRÁRIO. TEMA REPETITIVO 1099. CRÉDITO RURAL. CONTRATO. PRORROGAÇÃO. MORA. A mora do devedor rural não se configura enquanto não houver notificação específica para pagamento após o término do prazo originalmente ajustado, sendo automática a prorrogação quando verificadas as hipóteses do art. 50, §§ 5º e 6º, do Decreto-Lei n.º 167/67.",
    ementaResumida: "Contratos de crédito rural têm prorrogação automática nas hipóteses do Decreto-Lei 167/67. A mora só se constitui após notificação específica.",
    tribunal: "STJ",
    relator: "Min. Ricardo Villas Bôas Cueva",
    dataJulgamento: "2022-11-09",
    tipo: "tema_stj",
    materias: ["crédito rural", "prorrogação de débito rural", "mora", "direito bancário"],
    tese: "A prorrogação de contratos de crédito rural é automática nas hipóteses legais. Sem notificação pós-prorrogação, não há mora configurada.",
    fundamentosLegais: ["Art. 50, §§ 5º e 6º, Decreto-Lei n.º 167/67", "Art. 397, CC"],
    relevancia: 5,
    criadoEm: "2026-01-12T10:00:00Z",
  },
  {
    id: "JD-003",
    titulo: "Súmula 648 STJ — Alienação fiduciária e produtor rural",
    ementa: "A superveniência da Lei n.º 13.986/2020 (Lei do Agro), ao instituir a Cédula Imobiliária Rural (CIR) e disciplinar a alienação fiduciária de imóvel rural, não implica revogação tácita das disposições anteriores sobre garantias reais rurais.",
    ementaResumida: "A Lei do Agro (13.986/2020) não revogou normas anteriores sobre garantias rurais — convivem harmonicamente.",
    tribunal: "STJ",
    dataJulgamento: "2023-05-10",
    tipo: "sumula",
    materias: ["direito agrário", "alienação fiduciária", "lei do agro", "garantias rurais"],
    fundamentosLegais: ["Lei n.º 13.986/2020", "Decreto-Lei n.º 167/67"],
    relevancia: 4,
    criadoEm: "2026-01-15T10:00:00Z",
  },
  {
    id: "JD-004",
    titulo: "ARE 1.258.645 STF — Repercussão Geral: competência para ação de arrendamento rural",
    ementa: "COMPETÊNCIA. AÇÃO RELATIVA A CONTRATO DE ARRENDAMENTO RURAL. VARA AGRÁRIA. ART. 126, CF/88. A Constituição Federal impõe a criação de varas agrárias com competência exclusiva para processar e julgar questões possessórias e dominiais relativas à terras rurais. Repercussão geral reconhecida.",
    ementaResumida: "Ações de arrendamento rural devem tramitar em varas agrárias especializadas, conforme art. 126 da CF/88.",
    tribunal: "STF",
    relator: "Min. Edson Fachin",
    dataJulgamento: "2020-09-15",
    tipo: "repercussao_geral",
    materias: ["competência", "arrendamento rural", "vara agrária", "direito processual"],
    fundamentosLegais: ["Art. 126, CF/88", "Lei n.º 4.947/66"],
    relevancia: 4,
    criadoEm: "2026-01-20T10:00:00Z",
  },
  {
    id: "JD-005",
    titulo: "REsp 1.920.300/GO — Parceria agrícola: percentual mínimo ao parceiro-outorgado",
    ementa: "DIREITO AGRÁRIO. PARCERIA AGRÍCOLA. PERCENTUAL MÍNIMO. ESTATUTO DA TERRA. Art. 96, VI, 'a'. É nula de pleno direito a cláusula de parceria agrícola que estipule participação inferior a 25% dos frutos ao parceiro-outorgado, por violação ao piso protetivo do Estatuto da Terra.",
    ementaResumida: "Cláusula de parceria agrícola que atribui menos de 25% dos frutos ao parceiro-outorgado é nula — violação ao Estatuto da Terra.",
    tribunal: "STJ",
    relator: "Min. Nancy Andrighi",
    dataJulgamento: "2022-03-22",
    tipo: "acordao",
    materias: ["parceria agrícola", "estatuto da terra", "percentual mínimo", "nulidade"],
    tese: "O piso de 25% ao parceiro-outorgado em contratos de parceria agrícola é norma cogente — cláusula que o reduza é nula.",
    fundamentosLegais: ["Art. 96, VI, 'a', Estatuto da Terra (Lei n.º 4.504/64)"],
    relevancia: 5,
    criadoEm: "2026-02-01T10:00:00Z",
  },
  {
    id: "JD-006",
    titulo: "AgRg no REsp 1.654.321/MT — Prazo de arrendamento rural abaixo do mínimo legal",
    ementa: "DIREITO AGRÁRIO. ARRENDAMENTO RURAL. PRAZO MÍNIMO LEGAL. DECRETO N.º 59.566/66. O prazo de arrendamento inferior ao mínimo legal é automaticamente prorrogado pelo prazo mínimo previsto no art. 13 do Decreto n.º 59.566/66, independentemente de manifestação das partes.",
    ementaResumida: "Prazo de arrendamento rural abaixo do mínimo legal é prorrogado automaticamente pelo Decreto 59.566/66.",
    tribunal: "STJ",
    tipo: "acordao",
    dataJulgamento: "2021-06-15",
    materias: ["arrendamento rural", "prazo mínimo", "prorrogação automática"],
    fundamentosLegais: ["Art. 13, Decreto n.º 59.566/66", "Estatuto da Terra"],
    relevancia: 4,
    criadoEm: "2026-02-10T10:00:00Z",
  },
  {
    id: "JD-007",
    titulo: "REsp 1.789.654/MT — Honorários advocatícios em execução fiscal vs. produtor rural",
    ementa: "PROCESSUAL CIVIL. EXECUÇÃO FISCAL. PRODUTOR RURAL. HONORÁRIOS ADVOCATÍCIOS. SÚMULA 7/STJ. Em execução fiscal promovida contra produtor rural pessoa física, os honorários advocatícios devem ser fixados com base no CPC, respeitada a capacidade econômica do executado apurada nos autos.",
    ementaResumida: "Em execução fiscal contra produtor rural, honorários são fixados pelo CPC considerando a capacidade econômica apurada nos autos.",
    tribunal: "STJ",
    tipo: "acordao",
    dataJulgamento: "2020-11-03",
    materias: ["honorários advocatícios", "execução fiscal", "produtor rural"],
    fundamentosLegais: ["Art. 85, §§ 2º e 8º, CPC", "Súmula 7/STJ"],
    relevancia: 3,
    criadoEm: "2026-02-15T10:00:00Z",
  },

  // ── DIREITO DO TRABALHO ─────────────────────────────────────
  {
    id: "JD-008",
    titulo: "Súmula 331/TST — Terceirização lícita e responsabilidade subsidiária",
    ementa: "CONTRATO DE PRESTAÇÃO DE SERVIÇOS. LEGALIDADE. I — A contratação de trabalhadores por empresa interposta é ilegal, formando-se o vínculo diretamente com o tomador dos serviços, salvo no caso de trabalho temporário (Lei n.º 6.019/74). II — A contratação irregular de trabalhador, mediante empresa interposta, não gera vínculo de emprego com os órgãos da Administração Pública direta, indireta ou fundacional (art. 37, II, da CF/88). III — Não forma vínculo de emprego com o tomador a contratação de serviços de vigilância (Lei n.º 7.102/83) e de conservação e limpeza, bem como a de serviços especializados ligados à atividade-meio do tomador, desde que inexistente a pessoalidade e a subordinação direta. IV — O inadimplemento das obrigações trabalhistas, por parte do empregador, implica a responsabilidade subsidiária do tomador dos serviços quanto àquelas obrigações, desde que hajam participado da relação processual e constem também do título executivo judicial.",
    ementaResumida: "Terceirização é lícita para atividade-meio. Tomador de serviços responde subsidiariamente pelo inadimplemento trabalhista da empresa terceirizada.",
    tribunal: "TST",
    tipo: "sumula",
    dataJulgamento: "2011-05-24",
    materias: ["terceirização", "vínculo empregatício", "responsabilidade subsidiária", "direito do trabalho"],
    tese: "A empresa tomadora de serviços responde subsidiariamente pelas obrigações trabalhistas inadimplidas pela prestadora (terceirizada), quando há terceirização lícita de atividade-meio.",
    fundamentosLegais: ["Art. 37, II, CF/88", "Lei n.º 6.019/74", "CLT"],
    relevancia: 5,
    criadoEm: "2026-02-20T10:00:00Z",
  },
  {
    id: "JD-009",
    titulo: "Súmula 308/TST — Prescrição bienal em ação trabalhista",
    ementa: "PRESCRIÇÃO BIENAL. EXTINÇÃO DO CONTRATO. A prescrição bienal prevista no art. 7.º, XXIX, da CF/88 tem como marco inicial a data da extinção do contrato de trabalho. Proposta a ação dentro desse prazo, as parcelas anteriores a 5 anos da propositura da ação podem ser alcançadas pela prescrição quinquenal.",
    ementaResumida: "A ação trabalhista deve ser proposta em até 2 anos da rescisão. Dentro desse prazo, podem ser reclamadas verbas dos últimos 5 anos do contrato.",
    tribunal: "TST",
    tipo: "sumula",
    dataJulgamento: "2005-09-19",
    materias: ["prescrição bienal", "prescrição quinquenal", "prazo", "direito do trabalho"],
    tese: "Extinção do contrato de trabalho inicia o prazo prescricional bienal (2 anos). Dentro desse prazo, podem ser reclamados créditos dos últimos 5 anos.",
    fundamentosLegais: ["Art. 7º, XXIX, CF/88", "Art. 11, CLT"],
    relevancia: 5,
    criadoEm: "2026-02-22T10:00:00Z",
  },

  // ── DIREITO TRIBUTÁRIO ──────────────────────────────────────
  {
    id: "JD-010",
    titulo: "Tema 69/STF — ICMS não compõe base de cálculo do PIS e da COFINS",
    ementa: "TRIBUTÁRIO. PIS. COFINS. BASE DE CÁLCULO. ICMS. EXCLUSÃO. O ICMS não compõe a base de cálculo para fins de incidência do PIS e da COFINS. O conceito constitucional de faturamento/receita bruta não alcança valores que, embora transitem pelo caixa do contribuinte, pertencem ao erário. Modulação de efeitos: a decisão produz efeitos ex nunc a partir de 15/03/2017, ressalvadas ações judiciais e administrativas propostas anteriormente.",
    ementaResumida: "O ICMS não integra a base de cálculo do PIS/COFINS. Contribuintes têm direito à restituição/compensação dos valores indevidamente recolhidos desde 15/03/2017 (ou antes, se já havia ação judicial).",
    tribunal: "STF",
    relator: "Min. Cármen Lúcia",
    dataJulgamento: "2017-03-15",
    tipo: "repercussao_geral",
    materias: ["PIS", "COFINS", "ICMS", "base de cálculo", "restituição", "direito tributário"],
    tese: "O ICMS não compõe a base de cálculo do PIS/COFINS. Contribuintes têm direito à restituição/compensação dos valores recolhidos a maior desde a modulação (15/03/2017).",
    fundamentosLegais: ["Art. 195, I, 'b', CF/88", "Lei n.º 10.637/2002", "Lei n.º 10.833/2003"],
    relevancia: 5,
    criadoEm: "2026-02-25T10:00:00Z",
  },
  {
    id: "JD-011",
    titulo: "REsp 1.111.003/PR — Compensação tributária e prazo prescricional",
    ementa: "TRIBUTÁRIO. COMPENSAÇÃO. PRAZO PRESCRICIONAL. PRESCRIÇÃO QUINQUENAL. A pretensão de compensação de créditos tributários é prescritível no prazo de 5 (cinco) anos contados do pagamento indevido, nos termos do art. 168, I, do CTN, aplicando-se o regime de repetição de indébito.",
    ementaResumida: "O prazo para requerer compensação de tributos pagos indevidamente é de 5 anos contados do pagamento, nos termos do art. 168, I, CTN.",
    tribunal: "STJ",
    tipo: "acordao",
    dataJulgamento: "2009-06-24",
    materias: ["compensação tributária", "prescrição quinquenal", "repetição de indébito", "direito tributário"],
    tese: "O prazo prescricional para compensação/restituição de tributo pago indevidamente é de 5 anos do pagamento (art. 168, I, CTN).",
    fundamentosLegais: ["Art. 168, I, CTN", "Art. 170, CTN", "Lei n.º 9.430/96"],
    relevancia: 4,
    criadoEm: "2026-03-01T10:00:00Z",
  },

  // ── DIREITO DO CONSUMIDOR ───────────────────────────────────
  {
    id: "JD-012",
    titulo: "REsp 1.195.642/RJ — Responsabilidade objetiva do fornecedor por vício do serviço",
    ementa: "CONSUMIDOR. RESPONSABILIDADE OBJETIVA. VÍCIO DO SERVIÇO. DANO MORAL. NEXO CAUSAL. A responsabilidade civil do fornecedor de serviços por vício é objetiva (art. 14, CDC), dispensando prova de culpa. Demonstrado o nexo causal entre o serviço defeituoso e o dano, a obrigação de indenizar é automática. A excludente de responsabilidade deve ser provada pelo fornecedor.",
    ementaResumida: "O fornecedor responde objetivamente pelo defeito no serviço. O consumidor precisa provar apenas o dano e o nexo causal — não precisa provar culpa.",
    tribunal: "STJ",
    tipo: "acordao",
    dataJulgamento: "2010-10-13",
    materias: ["responsabilidade objetiva", "vício do serviço", "dano moral", "CDC", "direito do consumidor"],
    tese: "A responsabilidade do fornecedor é objetiva: basta ao consumidor provar dano e nexo causal. A culpa é irrelevante; eventuais excludentes devem ser demonstradas pelo fornecedor.",
    fundamentosLegais: ["Art. 14, CDC (Lei 8.078/90)", "Art. 12, CDC", "Art. 6º, VIII, CDC (inversão do ônus)"],
    relevancia: 5,
    criadoEm: "2026-03-05T10:00:00Z",
  },
  {
    id: "JD-013",
    titulo: "Súmula 297/STJ — Aplicação do CDC às instituições financeiras",
    ementa: "O Código de Defesa do Consumidor é aplicável às instituições financeiras.",
    ementaResumida: "Bancos e financeiras estão sujeitos ao CDC — relações bancárias com clientes pessoas físicas são relações de consumo.",
    tribunal: "STJ",
    tipo: "sumula",
    dataJulgamento: "2004-05-12",
    materias: ["CDC", "instituição financeira", "banco", "relação de consumo", "direito do consumidor"],
    tese: "Instituições financeiras são fornecedoras de serviços para fins do CDC. Contratos bancários com consumidores admitem revisão por abusividade, inversão do ônus da prova e dano moral.",
    fundamentosLegais: ["Lei 8.078/90 (CDC)", "Art. 3º, § 2º, CDC"],
    relevancia: 5,
    criadoEm: "2026-03-08T10:00:00Z",
  },
];

const jdStore: Jurisprudencia[] = [...JD_MOCK];

export class MockJurisprudenciaRepository {
  async listar(filtros?: { tribunal?: string; tipo?: TipoDecisao; materia?: string }): Promise<Jurisprudencia[]> {
    let resultado = [...jdStore];
    if (filtros?.tribunal) resultado = resultado.filter((j) => j.tribunal.toLowerCase() === filtros.tribunal!.toLowerCase());
    if (filtros?.tipo) resultado = resultado.filter((j) => j.tipo === filtros.tipo);
    if (filtros?.materia) {
      const m = filtros.materia.toLowerCase();
      resultado = resultado.filter((j) => j.materias.some((mat) => mat.toLowerCase().includes(m)));
    }
    return resultado.sort((a, b) => b.relevancia - a.relevancia);
  }

  async pesquisarPorTexto(query: string): Promise<Jurisprudencia[]> {
    const q = query.toLowerCase();
    return jdStore
      .filter((j) =>
        j.titulo.toLowerCase().includes(q) ||
        j.ementa.toLowerCase().includes(q) ||
        j.materias.some((m) => m.toLowerCase().includes(q)) ||
        (j.tese?.toLowerCase().includes(q) ?? false)
      )
      .sort((a, b) => b.relevancia - a.relevancia);
  }

  async obterPorId(id: string): Promise<Jurisprudencia | null> {
    return jdStore.find((j) => j.id === id) ?? null;
  }

  async criar(dados: Omit<Jurisprudencia, "id" | "criadoEm">): Promise<Jurisprudencia> {
    const id = `JD-${String(jdStore.length + 1).padStart(3, "0")}`;
    const nova: Jurisprudencia = { id, ...dados, criadoEm: new Date().toISOString() };
    jdStore.push(nova);
    return nova;
  }
}
