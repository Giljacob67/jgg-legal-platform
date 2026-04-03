import type { TipoPecaCanonica } from "@/modules/peticoes/domain/geracao-minuta";
import {
  listarChecklistsJuridicosAtivos,
  listarTesesJuridicasAtivas,
} from "@/modules/peticoes/base-juridica-viva/application/useCases";
import { PESOS_SCORE_QUALIDADE_PADRAO } from "@/modules/peticoes/base-juridica-viva/domain/types";
import type {
  CatalogoTesesRepository,
  ChecklistRepository,
  ConfigScoreRepository,
} from "@/modules/peticoes/inteligencia-juridica/application/contracts";
import type {
  ChecklistItem,
  PesosScoreQualidade,
  TeseJuridicaCatalogo,
} from "@/modules/peticoes/inteligencia-juridica/domain/types";

function parsePesosFromEnv(): PesosScoreQualidade | null {
  const value = process.env.INTELIGENCIA_JURIDICA_PESOS;
  if (!value?.trim()) {
    return null;
  }

  try {
    const parsed = JSON.parse(value) as Partial<PesosScoreQualidade>;

    if (
      typeof parsed.checklistObrigatorio !== "number" ||
      typeof parsed.checklistRecomendavel !== "number" ||
      typeof parsed.blocos !== "number" ||
      typeof parsed.referencias !== "number" ||
      typeof parsed.coerencia !== "number"
    ) {
      return null;
    }

    return {
      checklistObrigatorio: parsed.checklistObrigatorio,
      checklistRecomendavel: parsed.checklistRecomendavel,
      blocos: parsed.blocos,
      referencias: parsed.referencias,
      coerencia: parsed.coerencia,
    };
  } catch {
    return null;
  }
}

class MockCatalogoTesesRepository implements CatalogoTesesRepository {
  async listarPorTipoEMateria(input: {
    tipoPecaCanonica: TipoPecaCanonica;
    materiaCanonica: TeseJuridicaCatalogo["materias"][number];
    contextoTexto?: string;
  }): Promise<TeseJuridicaCatalogo[]> {
    return listarTesesJuridicasAtivas({
      tipoPecaCanonica: input.tipoPecaCanonica,
      materiaCanonica: input.materiaCanonica,
    });
  }
}

class MockChecklistRepository implements ChecklistRepository {
  async listarPorTipoPeca(input: { tipoPecaCanonica: TipoPecaCanonica }): Promise<ChecklistItem[]> {
    const materias: TeseJuridicaCatalogo["materias"][number][] = ["civel", "agrario_agronegocio", "bancario"];
    const resultados: ChecklistItem[] = [];

    for (const materia of materias) {
      const itens = await listarChecklistsJuridicosAtivos({
        tipoPecaCanonica: input.tipoPecaCanonica,
        materiaCanonica: materia,
      });

      for (const item of itens) {
        if (!resultados.some((atual) => atual.id === item.id)) {
          resultados.push(item);
        }
      }
    }

    return resultados;
  }
}

class MockConfigScoreRepository implements ConfigScoreRepository {
  async obterPesos(): Promise<PesosScoreQualidade> {
    return parsePesosFromEnv() ?? PESOS_SCORE_QUALIDADE_PADRAO;
  }
}

export function createMockInteligenciaJuridicaInfra() {
  return {
    catalogoTesesRepository: new MockCatalogoTesesRepository(),
    checklistRepository: new MockChecklistRepository(),
    configScoreRepository: new MockConfigScoreRepository(),
  };
}
