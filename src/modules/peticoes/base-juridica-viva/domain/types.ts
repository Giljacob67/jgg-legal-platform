import type {
  BlocoMinutaId,
  BlocoTemplateJuridico,
  EspecializacaoTemplateMateria,
  MateriaCanonica,
  TemplateJuridicoVersionado,
  TipoPecaCanonica,
} from "@/modules/peticoes/domain/geracao-minuta";
import type {
  ChecklistItem,
  GatilhoTese,
  PesosScoreQualidade,
  TeseJuridicaCatalogo,
} from "@/modules/peticoes/inteligencia-juridica/domain/types";

export type StatusAtivoJuridico = "ativo" | "inativo";
export type TipoAtivoJuridico = "template" | "tese" | "checklist";

export interface AtivoJuridicoVersionadoBase {
  id: string;
  codigo: string;
  versao: number;
  status: StatusAtivoJuridico;
  tiposPecaCanonica: TipoPecaCanonica[];
  materias: MateriaCanonica[];
  criadoEm: string;
  atualizadoEm: string;
}

export interface TemplateJuridicoAtivoVersionado extends AtivoJuridicoVersionadoBase {
  tipo: "template";
  nome: string;
  blocos: BlocoTemplateJuridico[];
  clausulasBase: {
    fundamentos: string[];
    pedidos: string[];
  };
  especializacaoPorMateria: Record<MateriaCanonica, EspecializacaoTemplateMateria>;
}

export interface TeseJuridicaAtivaVersionada extends AtivoJuridicoVersionadoBase {
  tipo: "tese";
  titulo: string;
  palavrasChave: string[];
  gatilhos: GatilhoTese[];
  teseBase: string;
  fundamentoSintetico: string;
}

export interface ChecklistJuridicoAtivoVersionado extends AtivoJuridicoVersionadoBase {
  tipo: "checklist";
  descricao: string;
  categoria: "obrigatorio" | "recomendavel";
  blocoEsperado: BlocoMinutaId | "geral";
  tokensEsperados: string[];
}

export type AtivoJuridicoVersionado =
  | TemplateJuridicoAtivoVersionado
  | TeseJuridicaAtivaVersionada
  | ChecklistJuridicoAtivoVersionado;

export interface FiltrosAtivosJuridicos {
  tipoPecaCanonica?: TipoPecaCanonica;
  materiaCanonica?: MateriaCanonica;
  status?: StatusAtivoJuridico;
}

export interface PayloadCriarNovaVersaoAtivo {
  nome?: string;
  titulo?: string;
  descricao?: string;
}

export function mapTemplateAtivoParaGeracao(input: {
  template: TemplateJuridicoAtivoVersionado;
  tipoPecaCanonica: TipoPecaCanonica;
}): TemplateJuridicoVersionado {
  return {
    id: input.template.id,
    nome: input.template.nome,
    tipoPecaCanonica: input.tipoPecaCanonica,
    versao: input.template.versao,
    ativo: input.template.status === "ativo",
    blocos: input.template.blocos,
    clausulasBase: input.template.clausulasBase,
    especializacaoPorMateria: input.template.especializacaoPorMateria,
  };
}

export function mapTeseAtivaParaCatalogo(tese: TeseJuridicaAtivaVersionada): TeseJuridicaCatalogo {
  return {
    id: tese.codigo,
    titulo: tese.titulo,
    tipoPecaCanonica: tese.tiposPecaCanonica,
    materias: tese.materias,
    palavrasChave: tese.palavrasChave,
    gatilhos: tese.gatilhos,
    teseBase: tese.teseBase,
    fundamentoSintetico: tese.fundamentoSintetico,
  };
}

export function mapChecklistAtivoParaItem(checklist: ChecklistJuridicoAtivoVersionado): ChecklistItem {
  return {
    id: checklist.codigo,
    descricao: checklist.descricao,
    tipoPecaCanonica: checklist.tiposPecaCanonica,
    categoria: checklist.categoria,
    blocoEsperado: checklist.blocoEsperado,
    tokensEsperados: checklist.tokensEsperados,
  };
}

export const PESOS_SCORE_QUALIDADE_PADRAO: PesosScoreQualidade = {
  checklistObrigatorio: 0.3,
  checklistRecomendavel: 0.1,
  blocos: 0.2,
  referencias: 0.15,
  coerencia: 0.25,
};
