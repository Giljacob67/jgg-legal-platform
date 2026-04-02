import "server-only";

import { getSqlClient } from "@/lib/database/client";
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

type TemplateRow = {
  id: string;
  codigo: string;
  nome: string;
  versao: number;
  status: StatusAtivoJuridico;
  tipos_peca_canonica: unknown;
  materias: unknown;
  blocos: unknown;
  clausulas_base: unknown;
  especializacao_materia: unknown;
  criado_em: string;
  atualizado_em: string;
};

type TeseRow = {
  id: string;
  codigo: string;
  titulo: string;
  versao: number;
  status: StatusAtivoJuridico;
  tipos_peca_canonica: unknown;
  materias: unknown;
  palavras_chave: unknown;
  gatilhos: unknown;
  tese_base: string;
  fundamento_sintetico: string;
  criado_em: string;
  atualizado_em: string;
};

type ChecklistRow = {
  id: string;
  codigo: string;
  descricao: string;
  categoria: "obrigatorio" | "recomendavel";
  bloco_esperado: ChecklistJuridicoAtivoVersionado["blocoEsperado"];
  versao: number;
  status: StatusAtivoJuridico;
  tipos_peca_canonica: unknown;
  materias: unknown;
  tokens_esperados: unknown;
  criado_em: string;
  atualizado_em: string;
};

function logDebug(mensagem: string, detalhe?: unknown): void {
  if (process.env.NODE_ENV !== "development") {
    return;
  }

  console.warn(`[peticoes][base-juridica-viva][real] ${mensagem}`, detalhe);
}

function parseJsonValue<T>(value: unknown, fallback: T, campo: string): T {
  if (value === null || value === undefined) {
    return fallback;
  }

  if (typeof value === "string") {
    try {
      return JSON.parse(value) as T;
    } catch (error) {
      logDebug(`Falha ao converter campo JSON "${campo}".`, { error, value });
      return fallback;
    }
  }

  return value as T;
}

function mapTemplate(row: TemplateRow): TemplateJuridicoAtivoVersionado {
  return {
    id: row.id,
    codigo: row.codigo,
    tipo: "template",
    nome: row.nome,
    versao: row.versao,
    status: row.status,
    tiposPecaCanonica: parseJsonValue<TipoPecaCanonica[]>(
      row.tipos_peca_canonica,
      [],
      "template_juridico_versao.tipos_peca_canonica",
    ),
    materias: parseJsonValue<MateriaCanonica[]>(row.materias, [], "template_juridico_versao.materias"),
    blocos: parseJsonValue<TemplateJuridicoAtivoVersionado["blocos"]>(row.blocos, [], "template_juridico_versao.blocos"),
    clausulasBase: parseJsonValue<TemplateJuridicoAtivoVersionado["clausulasBase"]>(
      row.clausulas_base,
      { fundamentos: [], pedidos: [] },
      "template_juridico_versao.clausulas_base",
    ),
    especializacaoPorMateria: parseJsonValue<TemplateJuridicoAtivoVersionado["especializacaoPorMateria"]>(
      row.especializacao_materia,
      {} as TemplateJuridicoAtivoVersionado["especializacaoPorMateria"],
      "template_juridico_versao.especializacao_materia",
    ),
    criadoEm: row.criado_em,
    atualizadoEm: row.atualizado_em,
  };
}

function mapTese(row: TeseRow): TeseJuridicaAtivaVersionada {
  return {
    id: row.id,
    codigo: row.codigo,
    tipo: "tese",
    titulo: row.titulo,
    versao: row.versao,
    status: row.status,
    tiposPecaCanonica: parseJsonValue<TipoPecaCanonica[]>(row.tipos_peca_canonica, [], "tese_juridica_versao.tipos_peca_canonica"),
    materias: parseJsonValue<MateriaCanonica[]>(row.materias, [], "tese_juridica_versao.materias"),
    palavrasChave: parseJsonValue<string[]>(row.palavras_chave, [], "tese_juridica_versao.palavras_chave"),
    gatilhos: parseJsonValue<TeseJuridicaAtivaVersionada["gatilhos"]>(row.gatilhos, [], "tese_juridica_versao.gatilhos"),
    teseBase: row.tese_base,
    fundamentoSintetico: row.fundamento_sintetico,
    criadoEm: row.criado_em,
    atualizadoEm: row.atualizado_em,
  };
}

function mapChecklist(row: ChecklistRow): ChecklistJuridicoAtivoVersionado {
  return {
    id: row.id,
    codigo: row.codigo,
    tipo: "checklist",
    descricao: row.descricao,
    categoria: row.categoria,
    blocoEsperado: row.bloco_esperado,
    versao: row.versao,
    status: row.status,
    tiposPecaCanonica: parseJsonValue<TipoPecaCanonica[]>(
      row.tipos_peca_canonica,
      [],
      "checklist_juridico_versao.tipos_peca_canonica",
    ),
    materias: parseJsonValue<MateriaCanonica[]>(row.materias, [], "checklist_juridico_versao.materias"),
    tokensEsperados: parseJsonValue<string[]>(
      row.tokens_esperados,
      [],
      "checklist_juridico_versao.tokens_esperados",
    ),
    criadoEm: row.criado_em,
    atualizadoEm: row.atualizado_em,
  };
}

class RealBaseJuridicaVivaRepository implements BaseJuridicaVivaRepository {
  private seeded = false;
  private storageDisponivel = true;

  private async ensureSeeded(): Promise<void> {
    if (!this.storageDisponivel) {
      throw new Error("BASE_JURIDICA_STORAGE_INDISPONIVEL");
    }

    if (this.seeded) {
      return;
    }

    const sql = getSqlClient();
    try {
      for (const item of criarTemplatesJuridicosPadrao()) {
        await sql`
          INSERT INTO template_juridico_versao (
            codigo, nome, versao, status, tipos_peca_canonica, materias, blocos, clausulas_base, especializacao_materia
          )
          VALUES (
            ${item.codigo},
            ${item.nome},
            ${item.versao},
            ${item.status},
            ${JSON.stringify(item.tiposPecaCanonica)}::jsonb,
            ${JSON.stringify(item.materias)}::jsonb,
            ${JSON.stringify(item.blocos)}::jsonb,
            ${JSON.stringify(item.clausulasBase)}::jsonb,
            ${JSON.stringify(item.especializacaoPorMateria)}::jsonb
          )
          ON CONFLICT (codigo, versao) DO NOTHING
        `;
      }

      for (const item of criarTesesJuridicasPadrao()) {
        await sql`
          INSERT INTO tese_juridica_versao (
            codigo, titulo, versao, status, tipos_peca_canonica, materias, palavras_chave, gatilhos, tese_base, fundamento_sintetico
          )
          VALUES (
            ${item.codigo},
            ${item.titulo},
            ${item.versao},
            ${item.status},
            ${JSON.stringify(item.tiposPecaCanonica)}::jsonb,
            ${JSON.stringify(item.materias)}::jsonb,
            ${JSON.stringify(item.palavrasChave)}::jsonb,
            ${JSON.stringify(item.gatilhos)}::jsonb,
            ${item.teseBase},
            ${item.fundamentoSintetico}
          )
          ON CONFLICT (codigo, versao) DO NOTHING
        `;
      }

      for (const item of criarChecklistsJuridicosPadrao()) {
        await sql`
          INSERT INTO checklist_juridico_versao (
            codigo, descricao, categoria, bloco_esperado, versao, status, tipos_peca_canonica, materias, tokens_esperados
          )
          VALUES (
            ${item.codigo},
            ${item.descricao},
            ${item.categoria},
            ${item.blocoEsperado},
            ${item.versao},
            ${item.status},
            ${JSON.stringify(item.tiposPecaCanonica)}::jsonb,
            ${JSON.stringify(item.materias)}::jsonb,
            ${JSON.stringify(item.tokensEsperados)}::jsonb
          )
          ON CONFLICT (codigo, versao) DO NOTHING
        `;
      }

      this.seeded = true;
    } catch (error) {
      if (typeof error === "object" && error !== null && "code" in error && (error as { code?: string }).code === "42P01") {
        this.storageDisponivel = false;
      }

      throw error;
    }
  }

  async listarTemplates(filtros?: FiltrosAtivosJuridicos): Promise<TemplateJuridicoAtivoVersionado[]> {
    await this.ensureSeeded();
    const sql = getSqlClient();
    const rows = await sql<TemplateRow[]>`
      SELECT *
      FROM template_juridico_versao
      WHERE (${filtros?.status ?? null}::text IS NULL OR status = ${filtros?.status ?? null})
        AND (${filtros?.tipoPecaCanonica ? JSON.stringify([filtros.tipoPecaCanonica]) : null}::jsonb IS NULL OR tipos_peca_canonica @> ${filtros?.tipoPecaCanonica ? JSON.stringify([filtros.tipoPecaCanonica]) : null}::jsonb)
        AND (${filtros?.materiaCanonica ? JSON.stringify([filtros.materiaCanonica]) : null}::jsonb IS NULL OR materias @> ${filtros?.materiaCanonica ? JSON.stringify([filtros.materiaCanonica]) : null}::jsonb)
      ORDER BY codigo ASC, versao DESC
    `;

    return rows.map(mapTemplate);
  }

  async obterTemplatePorId(id: string): Promise<TemplateJuridicoAtivoVersionado | null> {
    await this.ensureSeeded();
    const sql = getSqlClient();
    const [row] = await sql<TemplateRow[]>`SELECT * FROM template_juridico_versao WHERE id = ${id}`;
    return row ? mapTemplate(row) : null;
  }

  async atualizarStatusTemplate(id: string, status: StatusAtivoJuridico): Promise<TemplateJuridicoAtivoVersionado> {
    await this.ensureSeeded();
    const sql = getSqlClient();
    const [alvo] = await sql<TemplateRow[]>`SELECT * FROM template_juridico_versao WHERE id = ${id}`;
    if (!alvo) {
      throw new Error("Template jurídico não encontrado.");
    }

    if (status === "ativo") {
      await sql`
        UPDATE template_juridico_versao
        SET status = 'inativo',
            atualizado_em = NOW()
        WHERE codigo = ${alvo.codigo}
      `;
    }

    const [row] = await sql<TemplateRow[]>`
      UPDATE template_juridico_versao
      SET status = ${status},
          atualizado_em = NOW()
      WHERE id = ${id}
      RETURNING *
    `;

    return mapTemplate(row);
  }

  async criarNovaVersaoTemplate(id: string): Promise<TemplateJuridicoAtivoVersionado> {
    await this.ensureSeeded();
    const sql = getSqlClient();
    const [base] = await sql<TemplateRow[]>`SELECT * FROM template_juridico_versao WHERE id = ${id}`;
    if (!base) {
      throw new Error("Template jurídico não encontrado para versionamento.");
    }

    const [maxVersion] = await sql<{ versao: number }[]>`
      SELECT COALESCE(MAX(versao), 0) + 1 AS versao
      FROM template_juridico_versao
      WHERE codigo = ${base.codigo}
    `;

    const [novo] = await sql<TemplateRow[]>`
      INSERT INTO template_juridico_versao (
        codigo, nome, versao, status, tipos_peca_canonica, materias, blocos, clausulas_base, especializacao_materia
      )
      VALUES (
        ${base.codigo},
        ${base.nome},
        ${maxVersion.versao},
        ${"inativo"},
        ${JSON.stringify(parseJsonValue(base.tipos_peca_canonica, [], "tipos_peca_canonica"))}::jsonb,
        ${JSON.stringify(parseJsonValue(base.materias, [], "materias"))}::jsonb,
        ${JSON.stringify(parseJsonValue(base.blocos, [], "blocos"))}::jsonb,
        ${JSON.stringify(parseJsonValue(base.clausulas_base, { fundamentos: [], pedidos: [] }, "clausulas_base"))}::jsonb,
        ${JSON.stringify(parseJsonValue(base.especializacao_materia, {}, "especializacao_materia"))}::jsonb
      )
      RETURNING *
    `;

    return mapTemplate(novo);
  }

  async obterTemplateAtivoParaGeracao(input: {
    tipoPecaCanonica: TipoPecaCanonica;
    materiaCanonica: MateriaCanonica;
  }): Promise<TemplateJuridicoAtivoVersionado | null> {
    await this.ensureSeeded();
    const sql = getSqlClient();
    const [row] = await sql<TemplateRow[]>`
      SELECT *
      FROM template_juridico_versao
      WHERE status = 'ativo'
        AND tipos_peca_canonica @> ${JSON.stringify([input.tipoPecaCanonica])}::jsonb
        AND materias @> ${JSON.stringify([input.materiaCanonica])}::jsonb
      ORDER BY versao DESC
      LIMIT 1
    `;

    if (row) {
      return mapTemplate(row);
    }

    const [fallback] = await sql<TemplateRow[]>`
      SELECT *
      FROM template_juridico_versao
      WHERE status = 'ativo'
        AND tipos_peca_canonica @> ${JSON.stringify([input.tipoPecaCanonica])}::jsonb
      ORDER BY versao DESC
      LIMIT 1
    `;

    return fallback ? mapTemplate(fallback) : null;
  }

  async listarTeses(filtros?: FiltrosAtivosJuridicos): Promise<TeseJuridicaAtivaVersionada[]> {
    await this.ensureSeeded();
    const sql = getSqlClient();
    const rows = await sql<TeseRow[]>`
      SELECT *
      FROM tese_juridica_versao
      WHERE (${filtros?.status ?? null}::text IS NULL OR status = ${filtros?.status ?? null})
        AND (${filtros?.tipoPecaCanonica ? JSON.stringify([filtros.tipoPecaCanonica]) : null}::jsonb IS NULL OR tipos_peca_canonica @> ${filtros?.tipoPecaCanonica ? JSON.stringify([filtros.tipoPecaCanonica]) : null}::jsonb)
        AND (${filtros?.materiaCanonica ? JSON.stringify([filtros.materiaCanonica]) : null}::jsonb IS NULL OR materias @> ${filtros?.materiaCanonica ? JSON.stringify([filtros.materiaCanonica]) : null}::jsonb)
      ORDER BY codigo ASC, versao DESC
    `;
    return rows.map(mapTese);
  }

  async obterTesePorId(id: string): Promise<TeseJuridicaAtivaVersionada | null> {
    await this.ensureSeeded();
    const sql = getSqlClient();
    const [row] = await sql<TeseRow[]>`SELECT * FROM tese_juridica_versao WHERE id = ${id}`;
    return row ? mapTese(row) : null;
  }

  async atualizarStatusTese(id: string, status: StatusAtivoJuridico): Promise<TeseJuridicaAtivaVersionada> {
    await this.ensureSeeded();
    const sql = getSqlClient();
    const [alvo] = await sql<TeseRow[]>`SELECT * FROM tese_juridica_versao WHERE id = ${id}`;
    if (!alvo) {
      throw new Error("Tese jurídica não encontrada.");
    }

    if (status === "ativo") {
      await sql`
        UPDATE tese_juridica_versao
        SET status = 'inativo',
            atualizado_em = NOW()
        WHERE codigo = ${alvo.codigo}
      `;
    }

    const [row] = await sql<TeseRow[]>`
      UPDATE tese_juridica_versao
      SET status = ${status},
          atualizado_em = NOW()
      WHERE id = ${id}
      RETURNING *
    `;

    return mapTese(row);
  }

  async criarNovaVersaoTese(id: string): Promise<TeseJuridicaAtivaVersionada> {
    await this.ensureSeeded();
    const sql = getSqlClient();
    const [base] = await sql<TeseRow[]>`SELECT * FROM tese_juridica_versao WHERE id = ${id}`;
    if (!base) {
      throw new Error("Tese jurídica não encontrada para versionamento.");
    }

    const [maxVersion] = await sql<{ versao: number }[]>`
      SELECT COALESCE(MAX(versao), 0) + 1 AS versao
      FROM tese_juridica_versao
      WHERE codigo = ${base.codigo}
    `;

    const [novo] = await sql<TeseRow[]>`
      INSERT INTO tese_juridica_versao (
        codigo, titulo, versao, status, tipos_peca_canonica, materias, palavras_chave, gatilhos, tese_base, fundamento_sintetico
      )
      VALUES (
        ${base.codigo},
        ${base.titulo},
        ${maxVersion.versao},
        ${"inativo"},
        ${JSON.stringify(parseJsonValue(base.tipos_peca_canonica, [], "tipos_peca_canonica"))}::jsonb,
        ${JSON.stringify(parseJsonValue(base.materias, [], "materias"))}::jsonb,
        ${JSON.stringify(parseJsonValue(base.palavras_chave, [], "palavras_chave"))}::jsonb,
        ${JSON.stringify(parseJsonValue(base.gatilhos, [], "gatilhos"))}::jsonb,
        ${base.tese_base},
        ${base.fundamento_sintetico}
      )
      RETURNING *
    `;

    return mapTese(novo);
  }

  async listarTesesAtivas(input: {
    tipoPecaCanonica: TipoPecaCanonica;
    materiaCanonica: MateriaCanonica;
  }): Promise<TeseJuridicaAtivaVersionada[]> {
    return this.listarTeses({
      status: "ativo",
      tipoPecaCanonica: input.tipoPecaCanonica,
      materiaCanonica: input.materiaCanonica,
    });
  }

  async listarChecklists(filtros?: FiltrosAtivosJuridicos): Promise<ChecklistJuridicoAtivoVersionado[]> {
    await this.ensureSeeded();
    const sql = getSqlClient();
    const rows = await sql<ChecklistRow[]>`
      SELECT *
      FROM checklist_juridico_versao
      WHERE (${filtros?.status ?? null}::text IS NULL OR status = ${filtros?.status ?? null})
        AND (${filtros?.tipoPecaCanonica ? JSON.stringify([filtros.tipoPecaCanonica]) : null}::jsonb IS NULL OR tipos_peca_canonica @> ${filtros?.tipoPecaCanonica ? JSON.stringify([filtros.tipoPecaCanonica]) : null}::jsonb)
        AND (${filtros?.materiaCanonica ? JSON.stringify([filtros.materiaCanonica]) : null}::jsonb IS NULL OR materias @> ${filtros?.materiaCanonica ? JSON.stringify([filtros.materiaCanonica]) : null}::jsonb)
      ORDER BY codigo ASC, versao DESC
    `;
    return rows.map(mapChecklist);
  }

  async obterChecklistPorId(id: string): Promise<ChecklistJuridicoAtivoVersionado | null> {
    await this.ensureSeeded();
    const sql = getSqlClient();
    const [row] = await sql<ChecklistRow[]>`SELECT * FROM checklist_juridico_versao WHERE id = ${id}`;
    return row ? mapChecklist(row) : null;
  }

  async atualizarStatusChecklist(id: string, status: StatusAtivoJuridico): Promise<ChecklistJuridicoAtivoVersionado> {
    await this.ensureSeeded();
    const sql = getSqlClient();
    const [alvo] = await sql<ChecklistRow[]>`SELECT * FROM checklist_juridico_versao WHERE id = ${id}`;
    if (!alvo) {
      throw new Error("Checklist jurídico não encontrado.");
    }

    if (status === "ativo") {
      await sql`
        UPDATE checklist_juridico_versao
        SET status = 'inativo',
            atualizado_em = NOW()
        WHERE codigo = ${alvo.codigo}
      `;
    }

    const [row] = await sql<ChecklistRow[]>`
      UPDATE checklist_juridico_versao
      SET status = ${status},
          atualizado_em = NOW()
      WHERE id = ${id}
      RETURNING *
    `;

    return mapChecklist(row);
  }

  async criarNovaVersaoChecklist(id: string): Promise<ChecklistJuridicoAtivoVersionado> {
    await this.ensureSeeded();
    const sql = getSqlClient();
    const [base] = await sql<ChecklistRow[]>`SELECT * FROM checklist_juridico_versao WHERE id = ${id}`;
    if (!base) {
      throw new Error("Checklist jurídico não encontrado para versionamento.");
    }

    const [maxVersion] = await sql<{ versao: number }[]>`
      SELECT COALESCE(MAX(versao), 0) + 1 AS versao
      FROM checklist_juridico_versao
      WHERE codigo = ${base.codigo}
    `;

    const [novo] = await sql<ChecklistRow[]>`
      INSERT INTO checklist_juridico_versao (
        codigo, descricao, categoria, bloco_esperado, versao, status, tipos_peca_canonica, materias, tokens_esperados
      )
      VALUES (
        ${base.codigo},
        ${base.descricao},
        ${base.categoria},
        ${base.bloco_esperado},
        ${maxVersion.versao},
        ${"inativo"},
        ${JSON.stringify(parseJsonValue(base.tipos_peca_canonica, [], "tipos_peca_canonica"))}::jsonb,
        ${JSON.stringify(parseJsonValue(base.materias, [], "materias"))}::jsonb,
        ${JSON.stringify(parseJsonValue(base.tokens_esperados, [], "tokens_esperados"))}::jsonb
      )
      RETURNING *
    `;

    return mapChecklist(novo);
  }

  async listarChecklistsAtivos(input: {
    tipoPecaCanonica: TipoPecaCanonica;
    materiaCanonica: MateriaCanonica;
  }): Promise<ChecklistJuridicoAtivoVersionado[]> {
    return this.listarChecklists({
      status: "ativo",
      tipoPecaCanonica: input.tipoPecaCanonica,
      materiaCanonica: input.materiaCanonica,
    });
  }
}

export function createRealBaseJuridicaVivaInfra() {
  return {
    baseJuridicaVivaRepository: new RealBaseJuridicaVivaRepository(),
  };
}
