import "server-only";

import { getBaseJuridicaVivaInfra } from "@/modules/peticoes/base-juridica-viva/infrastructure/provider.server";
import type {
  AtivoJuridicoVersionado,
  ChecklistJuridicoAtivoVersionado,
  StatusAtivoJuridico,
  TemplateJuridicoAtivoVersionado,
  TeseJuridicaAtivaVersionada,
} from "@/modules/peticoes/base-juridica-viva/domain/types";
import {
  mapChecklistAtivoParaItem,
  mapTemplateAtivoParaGeracao,
  mapTeseAtivaParaCatalogo,
} from "@/modules/peticoes/base-juridica-viva/domain/types";
import {
  criarChecklistsJuridicosPadrao,
  criarTemplatesJuridicosPadrao,
  criarTesesJuridicasPadrao,
} from "@/modules/peticoes/base-juridica-viva/infrastructure/defaultCatalog";
import type { MateriaCanonica, TemplateJuridicoVersionado, TipoPecaCanonica } from "@/modules/peticoes/domain/geracao-minuta";
import type { ChecklistItem, TeseJuridicaCatalogo } from "@/modules/peticoes/inteligencia-juridica/domain/types";

export type TipoGestaoBaseJuridica = "templates" | "teses" | "checklists";

function logDebug(mensagem: string, detalhe?: unknown): void {
  if (process.env.NODE_ENV !== "development") {
    return;
  }

  console.warn(`[peticoes][base-juridica-viva][application] ${mensagem}`, detalhe);
}

function fallbackTemplateParaTipo(tipoPecaCanonica: TipoPecaCanonica): TemplateJuridicoAtivoVersionado | null {
  return criarTemplatesJuridicosPadrao().find((item) => item.tiposPecaCanonica.includes(tipoPecaCanonica)) ?? null;
}

function fallbackTesesAtivas(input: {
  tipoPecaCanonica: TipoPecaCanonica;
  materiaCanonica: MateriaCanonica;
}): TeseJuridicaCatalogo[] {
  return criarTesesJuridicasPadrao()
    .filter(
      (item) =>
        item.status === "ativo" &&
        item.tiposPecaCanonica.includes(input.tipoPecaCanonica) &&
        item.materias.includes(input.materiaCanonica),
    )
    .map(mapTeseAtivaParaCatalogo);
}

function fallbackChecklistAtivo(input: {
  tipoPecaCanonica: TipoPecaCanonica;
  materiaCanonica: MateriaCanonica;
}): ChecklistItem[] {
  return criarChecklistsJuridicosPadrao()
    .filter(
      (item) =>
        item.status === "ativo" &&
        item.tiposPecaCanonica.includes(input.tipoPecaCanonica) &&
        item.materias.includes(input.materiaCanonica),
    )
    .map(mapChecklistAtivoParaItem);
}

export async function listarAtivosBaseJuridica(tipo: TipoGestaoBaseJuridica): Promise<AtivoJuridicoVersionado[]> {
  const infra = getBaseJuridicaVivaInfra();

  try {
    if (tipo === "templates") {
      return await infra.baseJuridicaVivaRepository.listarTemplates();
    }

    if (tipo === "teses") {
      return await infra.baseJuridicaVivaRepository.listarTeses();
    }

    return await infra.baseJuridicaVivaRepository.listarChecklists();
  } catch (error) {
    logDebug("Falha ao listar ativos em repositório persistido. Usando fallback padrão.", { tipo, error });
    if (tipo === "templates") {
      return criarTemplatesJuridicosPadrao();
    }

    if (tipo === "teses") {
      return criarTesesJuridicasPadrao();
    }

    return criarChecklistsJuridicosPadrao();
  }
}

export async function obterAtivoBaseJuridicaPorId(
  tipo: TipoGestaoBaseJuridica,
  id: string,
): Promise<AtivoJuridicoVersionado | null> {
  const infra = getBaseJuridicaVivaInfra();

  try {
    if (tipo === "templates") {
      return await infra.baseJuridicaVivaRepository.obterTemplatePorId(id);
    }

    if (tipo === "teses") {
      return await infra.baseJuridicaVivaRepository.obterTesePorId(id);
    }

    return await infra.baseJuridicaVivaRepository.obterChecklistPorId(id);
  } catch (error) {
    logDebug("Falha ao obter detalhe no repositório persistido. Tentando fallback padrão.", { tipo, id, error });
    return (await listarAtivosBaseJuridica(tipo)).find((item) => item.id === id) ?? null;
  }
}

export async function atualizarStatusAtivoBaseJuridica(input: {
  tipo: TipoGestaoBaseJuridica;
  id: string;
  status: StatusAtivoJuridico;
}): Promise<AtivoJuridicoVersionado> {
  const infra = getBaseJuridicaVivaInfra();

  if (input.tipo === "templates") {
    return infra.baseJuridicaVivaRepository.atualizarStatusTemplate(input.id, input.status);
  }

  if (input.tipo === "teses") {
    return infra.baseJuridicaVivaRepository.atualizarStatusTese(input.id, input.status);
  }

  return infra.baseJuridicaVivaRepository.atualizarStatusChecklist(input.id, input.status);
}

export async function criarNovaVersaoAtivoBaseJuridica(input: {
  tipo: TipoGestaoBaseJuridica;
  id: string;
}): Promise<AtivoJuridicoVersionado> {
  const infra = getBaseJuridicaVivaInfra();

  if (input.tipo === "templates") {
    return infra.baseJuridicaVivaRepository.criarNovaVersaoTemplate(input.id);
  }

  if (input.tipo === "teses") {
    return infra.baseJuridicaVivaRepository.criarNovaVersaoTese(input.id);
  }

  return infra.baseJuridicaVivaRepository.criarNovaVersaoChecklist(input.id);
}

export async function obterTemplateJuridicoAtivoParaGeracao(input: {
  tipoPecaCanonica: TipoPecaCanonica;
  materiaCanonica: MateriaCanonica;
}): Promise<TemplateJuridicoVersionado> {
  const infra = getBaseJuridicaVivaInfra();
  try {
    const template = await infra.baseJuridicaVivaRepository.obterTemplateAtivoParaGeracao(input);
    if (template) {
      return mapTemplateAtivoParaGeracao({
        template,
        tipoPecaCanonica: input.tipoPecaCanonica,
      });
    }
  } catch (error) {
    logDebug("Falha ao buscar template ativo versionado. Usando fallback padrão.", { input, error });
  }

  const fallback = fallbackTemplateParaTipo(input.tipoPecaCanonica) ?? criarTemplatesJuridicosPadrao()[0];
  return mapTemplateAtivoParaGeracao({
    template: fallback,
    tipoPecaCanonica: input.tipoPecaCanonica,
  });
}

export async function listarTesesJuridicasAtivas(input: {
  tipoPecaCanonica: TipoPecaCanonica;
  materiaCanonica: MateriaCanonica;
}): Promise<TeseJuridicaCatalogo[]> {
  const infra = getBaseJuridicaVivaInfra();
  try {
    const teses = await infra.baseJuridicaVivaRepository.listarTesesAtivas(input);
    if (teses.length > 0) {
      return teses.map(mapTeseAtivaParaCatalogo);
    }
  } catch (error) {
    logDebug("Falha ao buscar teses ativas versionadas. Usando fallback padrão.", { input, error });
  }

  return fallbackTesesAtivas(input);
}

export async function listarChecklistsJuridicosAtivos(input: {
  tipoPecaCanonica: TipoPecaCanonica;
  materiaCanonica: MateriaCanonica;
}): Promise<ChecklistItem[]> {
  const infra = getBaseJuridicaVivaInfra();
  try {
    const checklists = await infra.baseJuridicaVivaRepository.listarChecklistsAtivos(input);
    if (checklists.length > 0) {
      return checklists.map(mapChecklistAtivoParaItem);
    }
  } catch (error) {
    logDebug("Falha ao buscar checklists ativos versionados. Usando fallback padrão.", { input, error });
  }

  return fallbackChecklistAtivo(input);
}

export async function listarResumoBaseJuridica(): Promise<{
  templates: TemplateJuridicoAtivoVersionado[];
  teses: TeseJuridicaAtivaVersionada[];
  checklists: ChecklistJuridicoAtivoVersionado[];
}> {
  const [templates, teses, checklists] = await Promise.all([
    listarAtivosBaseJuridica("templates"),
    listarAtivosBaseJuridica("teses"),
    listarAtivosBaseJuridica("checklists"),
  ]);

  return {
    templates: templates as TemplateJuridicoAtivoVersionado[],
    teses: teses as TeseJuridicaAtivaVersionada[],
    checklists: checklists as ChecklistJuridicoAtivoVersionado[],
  };
}
