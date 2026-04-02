import type { Caso } from "@/modules/casos/domain/types";
import type { ContextoJuridicoPedido, PedidoDePeca, ReferenciaDocumentalContexto } from "@/modules/peticoes/domain/types";

export type BlocoMinutaId =
  | "cabecalho"
  | "qualificacao_identificacao"
  | "sintese_fatica"
  | "fundamentos"
  | "pedidos"
  | "fechamento";

export type TipoPecaCanonica =
  | "peticao_inicial"
  | "contestacao"
  | "manifestacao"
  | "embargos_execucao"
  | "apelacao_civel"
  | "recurso_especial_civel";

export type MateriaCanonica = "civel" | "agrario_agronegocio" | "bancario";

export interface BlocoTemplateJuridico {
  id: BlocoMinutaId;
  titulo: string;
  orientacaoBase: string;
}

export interface EspecializacaoTemplateMateria {
  diretrizFundamentos: string;
  diretrizPedidos: string;
  termosPreferenciais: string[];
}

export interface TemplateJuridicoVersionado {
  id: string;
  nome: string;
  tipoPecaCanonica: TipoPecaCanonica;
  versao: number;
  ativo: boolean;
  blocos: BlocoTemplateJuridico[];
  clausulasBase: {
    fundamentos: string[];
    pedidos: string[];
  };
  especializacaoPorMateria: Record<MateriaCanonica, EspecializacaoTemplateMateria>;
}

export interface BlocoMinutaGerada {
  id: BlocoMinutaId;
  titulo: string;
  conteudo: string;
}

export interface RastroGeracaoMinuta {
  templateId: string;
  templateNome: string;
  templateVersao: number;
  tipoPecaCanonica: TipoPecaCanonica;
  materiaCanonica: MateriaCanonica;
  contextoVersao?: number;
  referenciasDocumentais: string[];
}

export interface MinutaGeradaEstruturada {
  conteudoCompleto: string;
  blocos: BlocoMinutaGerada[];
  rastro: RastroGeracaoMinuta;
}

export interface GerarMinutaEstruturadaInput {
  pedido: PedidoDePeca;
  caso?: Caso;
  contextoJuridico: ContextoJuridicoPedido | null;
  referenciasDocumentais: ReferenciaDocumentalContexto[];
  template: TemplateJuridicoVersionado;
  tipoPecaCanonica: TipoPecaCanonica;
  materiaCanonica: MateriaCanonica;
}

function normalizarParaComparacao(valor: string): string {
  return valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function normalizarTipoPecaCanonica(tipoPeca: string): TipoPecaCanonica {
  const base = normalizarParaComparacao(tipoPeca);

  if (base.includes("peticao inicial")) {
    return "peticao_inicial";
  }

  if (base.includes("contestacao")) {
    return "contestacao";
  }

  if (base.includes("embargos") && base.includes("execucao")) {
    return "embargos_execucao";
  }

  if (base.includes("apelacao") && base.includes("civel")) {
    return "apelacao_civel";
  }

  if (base.includes("recurso especial") && base.includes("civel")) {
    return "recurso_especial_civel";
  }

  if (base.includes("manifestacao") || base.includes("replica") || base === "recurso") {
    return "manifestacao";
  }

  return "manifestacao";
}

export function normalizarMateriaCanonica(materia?: string): MateriaCanonica {
  const base = normalizarParaComparacao(materia ?? "");

  if (base.includes("agrar") || base.includes("agro")) {
    return "agrario_agronegocio";
  }

  if (base.includes("banc")) {
    return "bancario";
  }

  return "civel";
}
