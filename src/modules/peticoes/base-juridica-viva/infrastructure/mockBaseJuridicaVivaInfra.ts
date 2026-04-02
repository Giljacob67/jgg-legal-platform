import "server-only";

import type { BaseJuridicaVivaRepository } from "@/modules/peticoes/base-juridica-viva/application/contracts";
import type {
  ChecklistJuridicoAtivoVersionado,
  FiltrosAtivosJuridicos,
  StatusAtivoJuridico,
  TemplateJuridicoAtivoVersionado,
  TeseJuridicaAtivaVersionada,
} from "@/modules/peticoes/base-juridica-viva/domain/types";
import {
  criarChecklistsJuridicosPadrao,
  criarTemplatesJuridicosPadrao,
  criarTesesJuridicasPadrao,
} from "@/modules/peticoes/base-juridica-viva/infrastructure/defaultCatalog";
import type { MateriaCanonica, TipoPecaCanonica } from "@/modules/peticoes/domain/geracao-minuta";

function gerarId(prefixo: string): string {
  return `${prefixo}-${Math.random().toString(36).slice(2, 10)}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

function filtrarPorMetadados<T extends { status: StatusAtivoJuridico; tiposPecaCanonica: TipoPecaCanonica[]; materias: MateriaCanonica[] }>(
  lista: T[],
  filtros?: FiltrosAtivosJuridicos,
): T[] {
  return lista.filter((item) => {
    if (filtros?.status && item.status !== filtros.status) {
      return false;
    }

    if (filtros?.tipoPecaCanonica && !item.tiposPecaCanonica.includes(filtros.tipoPecaCanonica)) {
      return false;
    }

    if (filtros?.materiaCanonica && !item.materias.includes(filtros.materiaCanonica)) {
      return false;
    }

    return true;
  });
}

let templatesState: TemplateJuridicoAtivoVersionado[] = criarTemplatesJuridicosPadrao();
let tesesState: TeseJuridicaAtivaVersionada[] = criarTesesJuridicasPadrao();
let checklistsState: ChecklistJuridicoAtivoVersionado[] = criarChecklistsJuridicosPadrao();

function ordenarPorCodigoEVersaoDesc<T extends { codigo: string; versao: number }>(lista: T[]): T[] {
  return [...lista].sort((a, b) => {
    if (a.codigo === b.codigo) {
      return b.versao - a.versao;
    }

    return a.codigo.localeCompare(b.codigo);
  });
}

class MockBaseJuridicaVivaRepository implements BaseJuridicaVivaRepository {
  async listarTemplates(filtros?: FiltrosAtivosJuridicos): Promise<TemplateJuridicoAtivoVersionado[]> {
    return ordenarPorCodigoEVersaoDesc(filtrarPorMetadados(templatesState, filtros));
  }

  async obterTemplatePorId(id: string): Promise<TemplateJuridicoAtivoVersionado | null> {
    return templatesState.find((item) => item.id === id) ?? null;
  }

  async atualizarStatusTemplate(id: string, status: StatusAtivoJuridico): Promise<TemplateJuridicoAtivoVersionado> {
    const atual = templatesState.find((item) => item.id === id);
    if (!atual) {
      throw new Error("Template jurídico não encontrado.");
    }

    if (status === "ativo") {
      templatesState = templatesState.map((item) =>
        item.codigo === atual.codigo
          ? {
              ...item,
              status: item.id === id ? "ativo" : "inativo",
              atualizadoEm: nowIso(),
            }
          : item,
      );
    } else {
      templatesState = templatesState.map((item) =>
        item.id === id
          ? {
              ...item,
              status: "inativo",
              atualizadoEm: nowIso(),
            }
          : item,
      );
    }

    return templatesState.find((item) => item.id === id)!;
  }

  async criarNovaVersaoTemplate(id: string): Promise<TemplateJuridicoAtivoVersionado> {
    const base = templatesState.find((item) => item.id === id);
    if (!base) {
      throw new Error("Template jurídico não encontrado para versionamento.");
    }

    const novaVersao = Math.max(...templatesState.filter((item) => item.codigo === base.codigo).map((item) => item.versao)) + 1;
    const criadoEm = nowIso();

    const novo: TemplateJuridicoAtivoVersionado = {
      ...structuredClone(base),
      id: gerarId("tpl"),
      versao: novaVersao,
      status: "inativo",
      criadoEm,
      atualizadoEm: criadoEm,
    };

    templatesState = [novo, ...templatesState];
    return novo;
  }

  async obterTemplateAtivoParaGeracao(input: {
    tipoPecaCanonica: TipoPecaCanonica;
    materiaCanonica: MateriaCanonica;
  }): Promise<TemplateJuridicoAtivoVersionado | null> {
    const candidatos = templatesState
      .filter(
        (item) =>
          item.status === "ativo" &&
          item.tiposPecaCanonica.includes(input.tipoPecaCanonica) &&
          item.materias.includes(input.materiaCanonica),
      )
      .sort((a, b) => b.versao - a.versao);

    if (candidatos[0]) {
      return candidatos[0];
    }

    const fallback = templatesState
      .filter((item) => item.status === "ativo" && item.tiposPecaCanonica.includes(input.tipoPecaCanonica))
      .sort((a, b) => b.versao - a.versao);

    return fallback[0] ?? null;
  }

  async listarTeses(filtros?: FiltrosAtivosJuridicos): Promise<TeseJuridicaAtivaVersionada[]> {
    return ordenarPorCodigoEVersaoDesc(filtrarPorMetadados(tesesState, filtros));
  }

  async obterTesePorId(id: string): Promise<TeseJuridicaAtivaVersionada | null> {
    return tesesState.find((item) => item.id === id) ?? null;
  }

  async atualizarStatusTese(id: string, status: StatusAtivoJuridico): Promise<TeseJuridicaAtivaVersionada> {
    const atual = tesesState.find((item) => item.id === id);
    if (!atual) {
      throw new Error("Tese jurídica não encontrada.");
    }

    if (status === "ativo") {
      tesesState = tesesState.map((item) =>
        item.codigo === atual.codigo
          ? {
              ...item,
              status: item.id === id ? "ativo" : "inativo",
              atualizadoEm: nowIso(),
            }
          : item,
      );
    } else {
      tesesState = tesesState.map((item) =>
        item.id === id
          ? {
              ...item,
              status: "inativo",
              atualizadoEm: nowIso(),
            }
          : item,
      );
    }

    return tesesState.find((item) => item.id === id)!;
  }

  async criarNovaVersaoTese(id: string): Promise<TeseJuridicaAtivaVersionada> {
    const base = tesesState.find((item) => item.id === id);
    if (!base) {
      throw new Error("Tese jurídica não encontrada para versionamento.");
    }

    const novaVersao = Math.max(...tesesState.filter((item) => item.codigo === base.codigo).map((item) => item.versao)) + 1;
    const criadoEm = nowIso();

    const novo: TeseJuridicaAtivaVersionada = {
      ...structuredClone(base),
      id: gerarId("tese"),
      versao: novaVersao,
      status: "inativo",
      criadoEm,
      atualizadoEm: criadoEm,
    };

    tesesState = [novo, ...tesesState];
    return novo;
  }

  async listarTesesAtivas(input: {
    tipoPecaCanonica: TipoPecaCanonica;
    materiaCanonica: MateriaCanonica;
  }): Promise<TeseJuridicaAtivaVersionada[]> {
    return tesesState
      .filter(
        (item) =>
          item.status === "ativo" &&
          item.tiposPecaCanonica.includes(input.tipoPecaCanonica) &&
          item.materias.includes(input.materiaCanonica),
      )
      .sort((a, b) => b.versao - a.versao);
  }

  async listarChecklists(filtros?: FiltrosAtivosJuridicos): Promise<ChecklistJuridicoAtivoVersionado[]> {
    return ordenarPorCodigoEVersaoDesc(filtrarPorMetadados(checklistsState, filtros));
  }

  async obterChecklistPorId(id: string): Promise<ChecklistJuridicoAtivoVersionado | null> {
    return checklistsState.find((item) => item.id === id) ?? null;
  }

  async atualizarStatusChecklist(id: string, status: StatusAtivoJuridico): Promise<ChecklistJuridicoAtivoVersionado> {
    const atual = checklistsState.find((item) => item.id === id);
    if (!atual) {
      throw new Error("Checklist jurídico não encontrado.");
    }

    if (status === "ativo") {
      checklistsState = checklistsState.map((item) =>
        item.codigo === atual.codigo
          ? {
              ...item,
              status: item.id === id ? "ativo" : "inativo",
              atualizadoEm: nowIso(),
            }
          : item,
      );
    } else {
      checklistsState = checklistsState.map((item) =>
        item.id === id
          ? {
              ...item,
              status: "inativo",
              atualizadoEm: nowIso(),
            }
          : item,
      );
    }

    return checklistsState.find((item) => item.id === id)!;
  }

  async criarNovaVersaoChecklist(id: string): Promise<ChecklistJuridicoAtivoVersionado> {
    const base = checklistsState.find((item) => item.id === id);
    if (!base) {
      throw new Error("Checklist jurídico não encontrado para versionamento.");
    }

    const novaVersao =
      Math.max(...checklistsState.filter((item) => item.codigo === base.codigo).map((item) => item.versao)) + 1;
    const criadoEm = nowIso();

    const novo: ChecklistJuridicoAtivoVersionado = {
      ...structuredClone(base),
      id: gerarId("chk"),
      versao: novaVersao,
      status: "inativo",
      criadoEm,
      atualizadoEm: criadoEm,
    };

    checklistsState = [novo, ...checklistsState];
    return novo;
  }

  async listarChecklistsAtivos(input: {
    tipoPecaCanonica: TipoPecaCanonica;
    materiaCanonica: MateriaCanonica;
  }): Promise<ChecklistJuridicoAtivoVersionado[]> {
    return checklistsState
      .filter(
        (item) =>
          item.status === "ativo" &&
          item.tiposPecaCanonica.includes(input.tipoPecaCanonica) &&
          item.materias.includes(input.materiaCanonica),
      )
      .sort((a, b) => b.versao - a.versao);
  }
}

export function createMockBaseJuridicaVivaInfra() {
  return {
    baseJuridicaVivaRepository: new MockBaseJuridicaVivaRepository(),
  };
}
