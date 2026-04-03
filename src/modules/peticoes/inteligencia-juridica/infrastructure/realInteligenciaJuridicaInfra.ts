import "server-only";

import { getSqlClient } from "@/lib/database/client";
import type { MateriaCanonica, TipoPecaCanonica } from "@/modules/peticoes/domain/geracao-minuta";
import type {
  CatalogoTesesRepository,
  ChecklistRepository,
  ConfigScoreRepository,
  InteligenciaJuridicaInfra,
} from "@/modules/peticoes/inteligencia-juridica/application/contracts";
import type {
  ChecklistItem,
  GatilhoTese,
  PesosScoreQualidade,
  TeseJuridicaCatalogo,
} from "@/modules/peticoes/inteligencia-juridica/domain/types";

type TeseRow = {
  id: string;
  titulo: string;
  tipos_peca_canonica: TipoPecaCanonica[] | string;
  materias: MateriaCanonica[] | string;
  palavras_chave: string[] | string;
  gatilhos: GatilhoTese[] | string;
  tese_base: string;
  fundamento_sintetico: string;
};

type ChecklistRow = {
  id: string;
  descricao: string;
  tipos_peca_canonica: TipoPecaCanonica[] | string;
  categoria: "obrigatorio" | "recomendavel";
  bloco_esperado: string;
  tokens_esperados: string[] | string;
};

function parseJson<T>(value: unknown, fallback: T): T {
  if (value === null || value === undefined) return fallback;
  if (typeof value === "string") {
    try { return JSON.parse(value) as T; } catch { return fallback; }
  }
  return value as T;
}

class RealCatalogoTesesRepository implements CatalogoTesesRepository {
  async listarPorTipoEMateria(input: {
    tipoPecaCanonica: TipoPecaCanonica;
    materiaCanonica: MateriaCanonica;
    contextoTexto?: string;
  }): Promise<TeseJuridicaCatalogo[]> {
    const sql = getSqlClient();
    
    // Se não tiver contextualText (ou se não tiver KEY da OpenAI validada localmente no momento), faz busca tradicional
    if (!input.contextoTexto || !process.env.OPENAI_API_KEY) {
      const rows = await sql<TeseRow[]>`
        SELECT id, titulo, tipos_peca_canonica, materias, palavras_chave,
               gatilhos, tese_base, fundamento_sintetico
        FROM tese_juridica_versao
        WHERE status = 'ativo'
          AND tipos_peca_canonica @> ${JSON.stringify([input.tipoPecaCanonica])}::jsonb
          AND materias @> ${JSON.stringify([input.materiaCanonica])}::jsonb
        ORDER BY atualizado_em DESC
      `;
      return rows.map((row) => ({
        id: row.id,
        titulo: row.titulo,
        tipoPecaCanonica: parseJson<TipoPecaCanonica[]>(row.tipos_peca_canonica, []),
        materias: parseJson<MateriaCanonica[]>(row.materias, []),
        palavrasChave: parseJson<string[]>(row.palavras_chave, []),
        gatilhos: parseJson<GatilhoTese[]>(row.gatilhos, []),
        teseBase: row.tese_base,
        fundamentoSintetico: row.fundamento_sintetico,
      }));
    }

    // Com contexto: Importar AI SDK dinamicamente para gerar embedding, e buscar ordenado pela distância
    const { embed } = await import("ai");
    const { openai } = await import("@ai-sdk/openai");

    try {
      const { embedding } = await embed({
        model: openai.embedding("text-embedding-3-small"),
        value: input.contextoTexto,
      });

      // Cosine distance <=> usando pgvector
      const rows = await sql<TeseRow[]>`
        SELECT id, titulo, tipos_peca_canonica, materias, palavras_chave,
               gatilhos, tese_base, fundamento_sintetico
        FROM tese_juridica_versao
        WHERE status = 'ativo'
          AND tipos_peca_canonica @> ${JSON.stringify([input.tipoPecaCanonica])}::jsonb
          AND materias @> ${JSON.stringify([input.materiaCanonica])}::jsonb
        ORDER BY embedding <=> ${JSON.stringify(embedding)}
        LIMIT 10
      `;

      return rows.map((row) => ({
        id: row.id,
        titulo: row.titulo,
        tipoPecaCanonica: parseJson<TipoPecaCanonica[]>(row.tipos_peca_canonica, []),
        materias: parseJson<MateriaCanonica[]>(row.materias, []),
        palavrasChave: parseJson<string[]>(row.palavras_chave, []),
        gatilhos: parseJson<GatilhoTese[]>(row.gatilhos, []),
        teseBase: row.tese_base,
        fundamentoSintetico: row.fundamento_sintetico,
      }));
    } catch (e) {
      console.error("Falha ao usar Semantic Search - Retornando Fallback:", e);
      // Fallback para busca tradicional
      const rows = await sql<TeseRow[]>`
        SELECT id, titulo, tipos_peca_canonica, materias, palavras_chave,
               gatilhos, tese_base, fundamento_sintetico
        FROM tese_juridica_versao
        WHERE status = 'ativo'
          AND tipos_peca_canonica @> ${JSON.stringify([input.tipoPecaCanonica])}::jsonb
          AND materias @> ${JSON.stringify([input.materiaCanonica])}::jsonb
        ORDER BY atualizado_em DESC
      `;
      return rows.map((row) => ({
        id: row.id,
        titulo: row.titulo,
        tipoPecaCanonica: parseJson<TipoPecaCanonica[]>(row.tipos_peca_canonica, []),
        materias: parseJson<MateriaCanonica[]>(row.materias, []),
        palavrasChave: parseJson<string[]>(row.palavras_chave, []),
        gatilhos: parseJson<GatilhoTese[]>(row.gatilhos, []),
        teseBase: row.tese_base,
        fundamentoSintetico: row.fundamento_sintetico,
      }));
    }
  }
}

class RealChecklistRepository implements ChecklistRepository {
  async listarPorTipoPeca(input: {
    tipoPecaCanonica: TipoPecaCanonica;
  }): Promise<ChecklistItem[]> {
    const sql = getSqlClient();
    const rows = await sql<ChecklistRow[]>`
      SELECT id, descricao, tipos_peca_canonica, categoria,
             bloco_esperado, tokens_esperados
      FROM checklist_juridico_versao
      WHERE status = 'ativo'
        AND tipos_peca_canonica @> ${JSON.stringify([input.tipoPecaCanonica])}::jsonb
      ORDER BY categoria ASC, atualizado_em DESC
    `;

    return rows.map((row) => ({
      id: row.id,
      descricao: row.descricao,
      tipoPecaCanonica: parseJson<TipoPecaCanonica[]>(row.tipos_peca_canonica, []),
      categoria: row.categoria,
      blocoEsperado: row.bloco_esperado as ChecklistItem["blocoEsperado"],
      tokensEsperados: parseJson<string[]>(row.tokens_esperados, []),
    }));
  }
}

class RealConfigScoreRepository implements ConfigScoreRepository {
  async obterPesos(): Promise<PesosScoreQualidade> {
    // Default weights — can be moved to DB/config later
    return {
      checklistObrigatorio: 0.35,
      checklistRecomendavel: 0.15,
      blocos: 0.20,
      referencias: 0.15,
      coerencia: 0.15,
    };
  }
}

export function createRealInteligenciaJuridicaInfra(): InteligenciaJuridicaInfra {
  return {
    catalogoTesesRepository: new RealCatalogoTesesRepository(),
    checklistRepository: new RealChecklistRepository(),
    configScoreRepository: new RealConfigScoreRepository(),
  };
}
