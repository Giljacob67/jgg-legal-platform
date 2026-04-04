import { SYSTEM_PROMPT_BASE } from "./base";
import type { ContextoJuridicoPedido } from "@/modules/peticoes/domain/types";
import type { MateriaCanonica } from "@/modules/peticoes/domain/geracao-minuta";

/** Riscos processuais e táticas adversariais específicos por matéria */
function buildRiscosEspecificosPorMateria(materia: MateriaCanonica): string {
  switch (materia) {
    case "agrario":
      return `RISCOS ADVERSARIAIS ESPECÍFICOS — DIREITO AGRÁRIO:
- Prescrição aquisitiva (usucapião): a parte contrária pode alegar posse ad usucapionem para afastar reivindicação
- Alegação de não-exploração direta: invalida pedido de retomada pelo arrendador (art. 95, VI, Estatuto da Terra)
- Contestação do CCIR / CAR: imóvel não cadastrado pode ter restrições de penhora/execução
- Alegação de prorrogação automática de arrendamento (Decreto 59.566/66) para impedir retomada
- Risco de reconhecimento de parceria rural dissimulada em vez de contrato de arrendamento
- Alegação de vício formal na notificação extrajudicial de retomada (prazo de 6 meses — art. 95, XII, ET)
- Em execução de CPR: contestação da classificação do produto entregue ou da prova de inadimplemento
- Prorrogação automática de crédito rural (Tema 1099/STJ) como defesa em cobranças de mora`;

    case "trabalhista":
      return `RISCOS ADVERSARIAIS ESPECÍFICOS — DIREITO DO TRABALHO:
- Prescrição bienal: créditos anteriores a 2 anos da propositura da ação estão prescritos (art. 7º, XXIX, CF)
- Banco de horas: empregador pode alegar compensação de horas extras por banco de horas formalmente instituído
- Jornada: cartão de ponto eletrônico com horários padronizados gera presunção relativa em favor do empregador
- Ausência de subordinação: empregador pode alegar natureza autônoma da prestação (pejotização)
- Culpa exclusiva do empregado em acidente de trabalho
- Ausência de dano ou nexo causal em assédio moral/acidente
- Quitação ampla por TRCT com assistência sindical (art. 477, CLT)`;

    case "tributario":
      return `RISCOS ADVERSARIAIS ESPECÍFICOS — DIREITO TRIBUTÁRIO:
- Decadência do direito de lançar: prazo de 5 anos (arts. 150/173, CTN) — verificar data do fato gerador
- Homologação tácita: contribuinte que declarou e pagou parcialmente pode ter débito homologado tacitamente
- Denúncia espontânea: pagamento antes de qualquer procedimento fiscal afasta multa (art. 138, CTN)
- Contestação de compensação: créditos utilizados podem ser impugnados pela Receita
- Súmula 436/STJ: simples entrega de DCTF/GFIP constitui o crédito, dispensando lançamento
- Alegação de solidariedade tributária (responsabilidade de sócios, art. 135, CTN)
- Discussão sobre base de cálculo (ex: Tema 69/STF — ICMS não compõe base do PIS/COFINS)`;

    case "criminal":
      return `RISCOS ADVERSARIAIS ESPECÍFICOS — DIREITO PENAL:
- Negativa de autoria vs. prova testemunhal ou perícia técnica em sentido contrário
- Prescricão da pretensão punitiva: verificar pena máxima × tabela do art. 109, CP
- Ministério Público pode requerer pena máxima com agravantes (reincidência, motivo torpe)
- Alegação de habitualidade criminosa para vedar sursis ou pena alternativa
- Custódia cautelar: risco de manutenção de preventiva se réu não comprovar residência e emprego fixo
- Fuga do réu como fundamento para decretação de preventiva (art. 312, CPP)
- Impugnação de provas ilícitas: atenção a violações de sigilo fiscal/telefônico sem ordem judicial`;

    case "consumidor":
      return `RISCOS ADVERSARIAIS ESPECÍFICOS — DIREITO DO CONSUMIDOR:
- Alegação de mau uso pelo consumidor como causa excludente de responsabilidade (art. 12, § 3º, III, CDC)
- Culpa exclusiva de terceiro: fornecedor pode alegar que dano foi causado por terceiro fora da cadeia
- Decadência: prazo de 30 dias (bens não duráveis) ou 90 dias (bens duráveis) para reclamar vício (art. 26, CDC)
- Prescrição quinquenal: art. 27, CDC — 5 anos para pretensão de reparação por fato do produto
- Ausência de relação de consumo: pessoa jurídica em atividade empresarial pode ser excluída do CDC
- Contestação do nexo causal entre o produto/serviço e o dano alegado`;

    default:
      return `RISCOS ADVERSARIAIS ESPECÍFICOS — DIREITO CÍVEL:
- Prescrição civil: regra geral de 10 anos (art. 205, CC) ou prazo especial (art. 206, CC)
- Ilegitimidade ativa ou passiva ad causam
- Ausência de interesse de agir (falta de utilidade/necessidade da tutela)
- Incompetência absoluta ou relativa do juízo
- Alegação de pagamento, novação, remissão ou compensação da dívida`;
  }
}

export function buildAnaliseAdversaPrompt(
  contexto: ContextoJuridicoPedido | null,
  fatos: unknown,
  materia: MateriaCanonica = "civel",
): { system: string; prompt: string } {
  return {
    system: SYSTEM_PROMPT_BASE,
    prompt: `Realize uma análise adversarial (perspectiva da parte contrária) do caso na área de ${materia.toUpperCase()}.

FATOS EXTRAÍDOS:
${JSON.stringify(fatos ?? {}, null, 2)}

CONTEXTO ADICIONAL:
${JSON.stringify(contexto ?? {}, null, 2)}

INSTRUÇÕES GERAIS:
1. Liste os PONTOS FORTES do nosso cliente (argumentos favoráveis)
2. Liste as VULNERABILIDADES do nosso cliente (pontos que a parte adversa vai explorar)
3. Antecipe os principais argumentos da DEFESA/PARTE CONTRÁRIA
4. Identifique riscos processuais (incompetência, prescrição, ilegitimidade, etc.)
5. Considere especialmente os riscos específicos da matéria abaixo

${buildRiscosEspecificosPorMateria(materia)}

FORMATO:
{
  "pontos_fortes": ["...", "..."],
  "pontos_vulneraveis": ["...", "..."],
  "argumentos_adversos_previstos": ["...", "..."],
  "riscos_processuais": ["...", "..."],
  "riscos_especificos_materia": ["...", "..."],
  "nivel_risco_geral": "baixo|medio|alto",
  "recomendacoes_cautela": "..."
}`,
  };
}
