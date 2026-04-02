import type { Caso } from "@/modules/casos/domain/types";

export interface CasosRepository {
  listarCasos(): Caso[];
  obterCasoPorId(casoId: string): Caso | undefined;
}

export class MockCasosRepository implements CasosRepository {
  private readonly casos: Caso[] = [
    {
      id: "CAS-2026-001",
      titulo: "Ação de Rescisão Contratual com Pedido Liminar",
      cliente: "Atlas Engenharia S.A.",
      materia: "Cível Empresarial",
      tribunal: "TJSP",
      status: "estratégia",
      prazoFinal: "2026-04-09",
      resumo:
        "Discussão sobre inadimplemento contratual com solicitação de tutela de urgência para suspensão de multas.",
      partes: [
        { nome: "Atlas Engenharia S.A.", papel: "autor" },
        { nome: "Delta Fornecimentos Ltda.", papel: "réu" },
      ],
      documentosRelacionados: ["DOC-001", "DOC-002", "DOC-003"],
      eventos: [
        {
          id: "EV-001",
          data: "2026-03-30T09:20:00-03:00",
          descricao: "Classificação inicial do caso concluída.",
        },
        {
          id: "EV-002",
          data: "2026-04-01T14:00:00-03:00",
          descricao: "Extração de fatos relevantes validada pelo coordenador.",
        },
      ],
    },
    {
      id: "CAS-2026-002",
      titulo: "Contestação Trabalhista - Horas Extras",
      cliente: "Rede Supernova Comércio",
      materia: "Trabalhista",
      tribunal: "TRT-2",
      status: "minuta em elaboração",
      prazoFinal: "2026-04-05",
      resumo:
        "Defesa em reclamação de horas extras e adicional noturno com foco na prova documental de jornada.",
      partes: [
        { nome: "Thiago Alves", papel: "autor" },
        { nome: "Rede Supernova Comércio", papel: "réu" },
      ],
      documentosRelacionados: ["DOC-004", "DOC-005"],
      eventos: [
        {
          id: "EV-003",
          data: "2026-03-28T10:00:00-03:00",
          descricao: "Leitura documental concluída com checklist interno.",
        },
      ],
    },
    {
      id: "CAS-2026-003",
      titulo: "Mandado de Segurança Tributário",
      cliente: "Horizonte Logística Ltda.",
      materia: "Tributário",
      tribunal: "TRF-3",
      status: "em análise",
      prazoFinal: "2026-04-15",
      resumo: "Medida para suspensão de exigibilidade de crédito tributário estadual.",
      partes: [
        { nome: "Horizonte Logística Ltda.", papel: "autor" },
        { nome: "Fazenda do Estado", papel: "réu" },
      ],
      documentosRelacionados: ["DOC-006"],
      eventos: [
        {
          id: "EV-004",
          data: "2026-04-01T08:45:00-03:00",
          descricao: "Caso recebido e classificado como prioridade média.",
        },
      ],
    },
  ];

  listarCasos(): Caso[] {
    return this.casos;
  }

  obterCasoPorId(casoId: string): Caso | undefined {
    return this.casos.find((caso) => caso.id === casoId);
  }
}
