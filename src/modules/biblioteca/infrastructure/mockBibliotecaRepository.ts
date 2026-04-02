import type { ItemBibliotecaJuridica } from "@/modules/biblioteca/domain/types";

export interface BibliotecaRepository {
  listarItens(): ItemBibliotecaJuridica[];
}

export class MockBibliotecaRepository implements BibliotecaRepository {
  private readonly itens: ItemBibliotecaJuridica[] = [
    {
      id: "BIB-001",
      tipo: "template",
      titulo: "Template de Petição Inicial Cível",
      materia: "Cível",
      ultimaAtualizacao: "2026-03-22",
      resumo: "Estrutura padrão com checklist de qualificação e pedidos liminares.",
      tags: ["petição inicial", "cível", "liminar"],
    },
    {
      id: "BIB-002",
      tipo: "template",
      titulo: "Template de Contestação Trabalhista",
      materia: "Trabalhista",
      ultimaAtualizacao: "2026-02-14",
      resumo: "Modelo base para defesa com preliminares e mérito.",
      tags: ["contestação", "trabalhista"],
    },
    {
      id: "BIB-003",
      tipo: "tese",
      titulo: "Tese de nulidade de prova unilateral",
      materia: "Cível",
      ultimaAtualizacao: "2026-03-30",
      resumo: "Argumentação sobre insuficiência de prova produzida sem contraditório.",
      tags: ["prova", "contraditório", "nulidade"],
    },
    {
      id: "BIB-004",
      tipo: "tese",
      titulo: "Tese de compensação de jornada",
      materia: "Trabalhista",
      ultimaAtualizacao: "2026-03-09",
      resumo: "Linha de defesa para banco de horas e compensação semanal.",
      tags: ["jornada", "banco de horas"],
    },
    {
      id: "BIB-005",
      tipo: "checklist",
      titulo: "Checklist de revisão pré-protocolo",
      materia: "Geral",
      ultimaAtualizacao: "2026-03-18",
      resumo: "Lista obrigatória para validação técnica antes de protocolar peça.",
      tags: ["revisão", "protocolo", "qualidade"],
    },
    {
      id: "BIB-006",
      tipo: "checklist",
      titulo: "Checklist de leitura documental",
      materia: "Geral",
      ultimaAtualizacao: "2026-03-25",
      resumo: "Pontos mínimos para leitura crítica de contratos e anexos.",
      tags: ["documentos", "triagem"],
    },
  ];

  listarItens(): ItemBibliotecaJuridica[] {
    return this.itens;
  }
}
