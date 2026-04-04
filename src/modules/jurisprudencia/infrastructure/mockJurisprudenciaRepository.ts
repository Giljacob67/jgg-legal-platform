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
