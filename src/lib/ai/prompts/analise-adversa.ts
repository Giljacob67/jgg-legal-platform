import { SYSTEM_PROMPT_BASE } from "./base";
import type { ContextoJuridicoPedido } from "@/modules/peticoes/domain/types";
import type { MateriaCanonica } from "@/modules/peticoes/domain/geracao-minuta";

/** Riscos processuais e táticas adversariais específicos por matéria */
function buildRiscosEspecificosPorMateria(materia: MateriaCanonica): string {
  switch (materia) {
    case "agrario_agronegocio":
      return `RISCOS ADVERSARIAIS ESPECÍFICOS — DIREITO AGRÁRIO:
Riscos gerais:
- Prescrição aquisitiva (usucapião): a parte contrária pode alegar posse ad usucapionem para afastar reivindicação
- Contestação do CCIR / CAR: imóvel não cadastrado pode ter restrições de penhora/execução

Sub-caso — Execução de CPR / CCR / CCB rural:
- Devedor pode alegar entrega parcial do produto como adimplemento parcial (exige revaloração do saldo)
- Contestação da classificação ou qualidade do produto entregue (laudo de classificação divergente)
- Alegação de prorrogação automática do crédito rural (Tema 1099/STJ): se o banco não concordou com a prorrogação legalmente, mora não se configura
- Alegação de excesso de execução por encargos não previstos no título (comissão de permanência, seguro embutido)
- Prescrição do título: CCR prescreve em 3 anos; CPR prescreve em 3 anos (art. 47, Lei 8.929/94)

Sub-caso — Arrendamento / parceria rural:
- Alegação de não-exploração direta pelo arrendador: invalida pedido de retomada (art. 95, VI, ET)
- Alegação de prorrogação automática do contrato (Decreto 59.566/66): prazo mínimo não cumprido
- Vício formal na notificação de retomada: prazo de 6 meses (art. 95, XII, ET) não respeitado ou notificação por via inadequada
- Reconhecimento de parceria rural dissimulada em vez de arrendamento (afeta cálculo de valores devidos)
- Direito de retenção do arrendatário por benfeitorias realizadas — impede imissão de posse sem indenização

Sub-caso — Impenhorabilidade rural:
- Credor pode argumentar que o imóvel supera 4 módulos fiscais (excluindo proteção constitucional)
- Alegação de que não há exploração direta da família no imóvel (imóvel arrendado a terceiros)
- Argumento de que a dívida não é decorrente da atividade produtiva (ex: dívida tributária, pessoal)
- Contestação da documentação comprobatória de residência e trabalho familiar

Sub-caso — Prorrogação / securitização de dívida rural:
- Banco pode alegar que não opera com recursos controlados (MCR) e que a securitização não é obrigatória
- Contestação de laudo técnico de insuficiência de renda (laudo particular sem homologação SENAR/EMATER)
- Alegação de descumprimento de requisitos do programa de prorrogação (ex: endividamento acima do limite)`;

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

    case "bancario":
      return `RISCOS ADVERSARIAIS ESPECÍFICOS — DIREITO BANCÁRIO:
Sub-caso — Revisão contratual:
- Banco pode alegar que taxa de juros foi livremente pactuada, publicada no BACEN e dentro da prática de mercado
- Capitalização mensal: banco vai invocar Súmula 596/STJ + MP 1.963-17/00 (liberação expressa quando pactuada)
- Seguros: banco pode apresentar campo de assinatura específica no contrato para afastar Súmula 530/STJ
- Tarifas: banco pode demonstrar que foram previamente informadas na proposta (Resolução BACEN 3.919/10)
- Novação: se houve repactuação posterior, encargos anteriores se incorporaram ao novo saldo — dificulta revisão retroativa

Sub-caso — Defesa em execução bancária:
- Banco pode alegar que CCB é título líquido, certo e exigível, com planilha de evolução correta (Lei 10.931/04)
- Prescrição: banco vai alegar que prazo quinquenal (art. 206, §5º, I, CC) ainda não expirou
- Exceção de pré-executividade: banco pode contestar admissibilidade alegando que matéria não é de ordem pública ou exige dilação probatória
- Comissão de permanência: banco pode alegar contratação expressa e que substitui outros encargos (Súmula 294/STJ)

Sub-caso — Negativação indevida:
- Banco pode apresentar contrato assinado demonstrando que dívida era legítima e exigível
- Alegação de que houve comunicação prévia ao devedor antes da inscrição (carta, e-mail, notificação)
- Súmula 385/STJ: se há outras inscrições legítimas, dano moral não se configura in re ipsa — banco vai buscar histórico de crédito do cliente
- Contrariedade ao dano: banco pode alegar que cliente tinha ciência da dívida e optou pelo inadimplemento

Sub-caso — Renegociação / revisão por onerosidade:
- Banco pode alegar ausência de evento superveniente imprevisível (variação de mercado é risco do negócio)
- Contestação da Teoria da Imprevisão: apenas eventos extraordinários e totalmente imprevisíveis justificam revisão (art. 478, CC)
- Alegação de que houve concordância expressa com as condições contratuais (pacta sunt servanda)
- Prescrição quinquenal (art. 206, §5º, I, CC) para cobrança de dívidas líquidas — verificar data do vencimento`;

    case "empresarial":
      return `RISCOS ADVERSARIAIS ESPECÍFICOS — DIREITO EMPRESARIAL:
- Alegação de regular deliberação assemblear (quórum e procedimentos cumpridos)
- Contestação do valor de haveres: balanço de determinação vs. balanço contábil
- Alegação de justa causa para exclusão de sócio (art. 1.030, CC)
- Sócio excluído pode questionar avaliação patrimonial e deságio aplicado
- Risco de dissolução total da sociedade ao invés de exclusão parcial
- Sócios majoritários podem alegar abuso de minoria bloqueadora
- Necessidade de perícia contábil como condição para prosseguir — dilata prazo e custo`;

    case "ambiental":
      return `RISCOS ADVERSARIAIS ESPECÍFICOS — DIREITO AMBIENTAL:
- Inversão do ônus da prova em favor do meio ambiente (princípio da precaução)
- Responsabilidade objetiva pelo dano ambiental — não é necessário provar culpa (art. 14, § 1º, Lei 6.938/81)
- Solidariedade entre poluidor direto e proprietário do imóvel, mesmo que este não tenha causado o dano
- Imprescritibilidade da pretensão de reparação de dano ambiental (STJ, REsp 1.120.117)
- Embargo administrativo pode bloquear atividades durante toda a instrução processual
- Ministério Público pode ingressar como litisconsorte e ampliar o objeto da lide`;

    case "familia":
      return `RISCOS ADVERSARIAIS ESPECÍFICOS — DIREITO DE FAMÍLIA:
- Alegação de regime de separação total de bens: cônjuge pode excluir patrimônio da partilha
- Contestação de data de início da união estável para reduzir período de comunhão
- Parte contrária pode requerer alimentos provisórios elevados como tática processual
- Disputa pela guarda pode se tornar instrumento de pressão patrimonial
- Alienação parental: acusação pode ser usada como estratégia processual por qualquer lado
- Reconhecimento de dívidas contraídas em nome do casal pode ampliar o passivo a partilhar`;

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
