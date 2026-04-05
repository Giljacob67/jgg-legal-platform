import { SYSTEM_PROMPT_BASE } from "./base";
import type { ContextoJuridicoPedido } from "@/modules/peticoes/domain/types";
import type { MateriaCanonica } from "@/modules/peticoes/domain/geracao-minuta";

/** Perguntas de extração específicas por matéria — complementam as perguntas gerais */
function buildQuestoesEspecificasPorMateria(materia: MateriaCanonica): string {
  switch (materia) {
    case "agrario_agronegocio":
      return `QUESTÕES ESPECÍFICAS — DIREITO AGRÁRIO / AGRONEGÓCIO:
Dados gerais do imóvel:
- Identificar o imóvel rural: CCIR n.º, CAR (Cadastro Ambiental Rural), matrícula do imóvel, módulo fiscal da região
- Confirmar a destinação do imóvel (agricultura, pecuária, mista) e se há exploração efetiva
- Registrar safra(s) em disputa: ano-safra, cultura plantada, estimativa de produção

Sub-caso 1 — Execução de CPR / CCR / CCB rural:
- Tipo do título: CPR física, CPR financeira, CCR ou CCB com garantia rural
- Banco emitente ou credor: nome, CNPJ, se opera com recursos controlados (MCR)
- Valor do título, data de emissão, data de vencimento e garantias constituídas (penhor, hipoteca, alienação fiduciária)
- Houve entrega parcial do produto ou pagamento parcial? Há prova de inadimplemento (notificação extrajudicial)?
- Verificar se houve prorrogação automática do crédito rural (Tema 1099/STJ) — isso impede a mora

Sub-caso 2 — Arrendamento / parceria rural:
- Tipo de contrato (arrendamento ou parceria): prazo estipulado, prazo mínimo legal (Lei 4.504/1964)
- Valor do arrendamento: em reais ou sacas de produto? Há histórico de inadimplência?
- Houve notificação de retomada com antecedência mínima de 6 meses (art. 95, XII, ET)?
- Motivo da retomada: uso próprio, exploração direta, venda? (verificar art. 95, VI, ET)
- Há contrato de parceria dissimulada como arrendamento? Percentual de divisão da produção?
- Benfeitorias realizadas pelo arrendatário/parceiro: foram autorizadas? Há direito de retenção?

Sub-caso 3 — Impenhorabilidade da pequena propriedade rural:
- Área total do imóvel em módulos fiscais: confirmar se é entre 1 e 4 módulos (pequena propriedade)
- A família reside e explora o imóvel diretamente? Há comprovação (FUNRURAL, eSocial, DAP)?
- A dívida executada é decorrente da atividade produtiva do imóvel?
- Há penhora ou ameaça de penhora já decretada? Data do ato judicial?

Sub-caso 4 — Prorrogação / renegociação de dívida rural (securitização):
- Natureza do crédito: custeio, investimento ou comercialização?
- Banco opera com recursos controlados do MCR? (Banco do Brasil, BNDES, Banco do Nordeste, etc.)
- Há laudo de insuficiência de renda ou intempérie climática? (requisito para securitização)
- O banco já negou o pedido de prorrogação formalmente? (necessário para Mandado de Segurança)
- Verificar prazo decadencial: 120 dias do ato coator para impetração do MS

Identificar o sub-caso principal e responder às perguntas correspondentes:`;

    case "trabalhista":
      return `QUESTÕES ESPECÍFICAS — DIREITO DO TRABALHO:
- Data de admissão e demissão (ou se ainda vigente o vínculo)
- Natureza da rescisão: sem justa causa, com justa causa, pedido de demissão, rescisão indireta
- CTPS anotada? Registro em sistema eletrônico (eSocial)?
- Jornada contratada x jornada praticada: há cartão de ponto? É manual ou eletrônico?
- Salário nominal e eventuais adicionais: horas extras, adicional noturno, insalubridade, periculosidade
- Houve recolhimento de FGTS? Há guias comprobatórias?
- Verbas rescisórias pagas? Há TRCT assinado?
- Prazo prescricional: bienal para ex-empregados (art. 7º, XXIX, CF); quinquenal para verbas exigíveis durante o contrato`;

    case "tributario":
      return `QUESTÕES ESPECÍFICAS — DIREITO TRIBUTÁRIO:
- Identificar o tributo (ICMS, ISS, PIS, COFINS, IRPJ, CSLL, ITR, etc.)
- Período de competência dos lançamentos em disputa
- Natureza do crédito: lançamento de ofício, homologação tácita, crédito declarado mas não pago
- Há Certidão de Dívida Ativa (CDA)? Número e valor atualizado
- Decadência (art. 173/150 CTN): data do fato gerador vs. data do lançamento
- Prescrição (art. 174 CTN): 5 anos a contar da constituição definitiva
- Houve parcelamento (REFIS/PERT/PARCELAMENTO ESTADUAL)? Está ativo?
- Compensação: há créditos próprios a compensar? (Tema 69/STF para ICMS na base PIS/COFINS)`;

    case "criminal":
      return `QUESTÕES ESPECÍFICAS — DIREITO PENAL / PROCESSUAL PENAL:
- Tipo penal imputado: crime e dispositivo legal (Código Penal, lei especial)
- Fase processual: inquérito, denúncia, instrução, sentença, recurso
- Réu preso (preventiva, temporária) ou solto? Data da prisão
- Antecedentes criminais: há condenações anteriores transitadas em julgado?
- Confissão extrajudicial ou judicial? Foi espontânea?
- Vítima identificada? Há dano reparável?
- Requisitos para benefícios: primariedade, bons antecedentes, residência fixa, trabalho lícito
- Possibilidade de desclassificação ou reconhecimento de causa de diminuição/excludente`;

    case "consumidor":
      return `QUESTÕES ESPECÍFICAS — DIREITO DO CONSUMIDOR:
- Relação de consumo configurada? Identificar fornecedor e consumidor (art. 2º e 3º, CDC)
- Produto ou serviço defeituoso? Natureza do defeito: vício ou fato do produto/serviço
- Data da descoberta do vício (início do prazo decadencial: 30 ou 90 dias, art. 26, CDC)
- Houve tentativa de solução extrajudicial (reclamação formal, PROCON, ReclameAqui)?
- Dano material: valor dos prejuízos comprovados
- Dano moral: houve constrangimento, abalo de crédito, situação vexatória?
- Fornecedor é parte de cadeia solidária (fabricante, importador, distribuidor, comerciante)?`;

    case "familia":
      return `QUESTÕES ESPECÍFICAS — DIREITO DE FAMÍLIA:
- Regime de bens do casamento/união estável e data de início
- Há bens imóveis, veículos, participações societárias, investimentos, dívidas?
- Filhos menores ou incapazes? Idades, necessidades especiais?
- Alimentos: já fixados? Qual o valor? Há inadimplemento?
- Guarda: situação fática atual — com quem residem os filhos?
- Houve separação de fato? Data aproximada
- Prova da união estável: documentos, testemunhas, contrato?`;

    case "bancario":
      return `QUESTÕES ESPECÍFICAS — DIREITO BANCÁRIO / CRÉDITO:
Dados gerais:
- Produto bancário: crédito rural, crédito pessoal, financiamento, conta garantida, leasing, cartão de crédito
- Banco/instituição financeira: nome, CNPJ; contrato físico assinado está disponível?
- CDC aplica-se (Súmula 297/STJ) — confirmar relação de consumo

Sub-caso 1 — Revisão contratual (encargos, anatocismo, seguros):
- Taxa de juros contratada (% a.m. e a.a.): comparar com taxa de mercado BACEN para a operação
- Há capitalização de juros? Frequência (diária, mensal, anual): verificar se foi expressamente pactuada (MP 1.963-17/00, Súmula 596/STJ)
- Seguros embutidos (prestamista, vida, DFI): foram contratados expressamente ou embutidos sem anuência? (Súmula 530/STJ)
- Tarifas bancárias cobradas: são permitidas pela Resolução BACEN ou abusivas?
- Valor do contrato original vs. saldo devedor atual: há planilha de evolução do débito?

Sub-caso 2 — Defesa em execução bancária (CCB, contrato, boleto):
- Título executado: CCB, contrato, duplicata, boleto? É título executivo extrajudicial?
- Há excesso de execução? Calcular diferença entre saldo em cobrança e saldo revisado
- Existem encargos indevidos embutidos (comissão de permanência abusiva, multa + juros moratórios acima de 2%)?
- Exceção de pré-executividade: há matéria de ordem pública que dispensa dilação probatória (prescrição, nulidade do título)?
- Prazo prescricional: 5 anos para dívidas líquidas (art. 206, §5º, I, CC) — verificar data do vencimento

Sub-caso 3 — Negativação indevida / abalo de crédito:
- Data e valor da inscrição nos cadastros de inadimplentes (SERASA, SPC, BACEN)
- A dívida que originou a negativação existia e era exigível? Houve pagamento antes da inscrição?
- Houve comunicação prévia ao devedor antes da inscrição (exigência legal)?
- Há outras negativações legítimas no histórico do cliente? (Súmula 385/STJ — afasta dano moral in re ipsa se preexistentes)
- Dano moral: prazo quinquenal da data do conhecimento da inscrição (art. 27, CDC)

Sub-caso 4 — Renegociação forçada / revisão de contrato por onerosidade excessiva:
- Evento superveniente imprevisível que gerou desequilíbrio contratual (seca, variação cambial, pandemia)?
- Houve tentativa de renegociação extrajudicial com o banco (protocolar)? Data e resposta do banco?
- Aplicação da Teoria da Imprevisão (art. 478, CC) ou Lesão (art. 157, CC)?
- Novação: houve repactuação que incorporou os encargos anteriores ao novo contrato?

Identificar o sub-caso principal e responder às perguntas correspondentes:`;

    case "empresarial":
      return `QUESTÕES ESPECÍFICAS — DIREITO EMPRESARIAL / SOCIETÁRIO:
- Tipo societário (LTDA, SA, EIRELI, SLU) e data de constituição
- Ato constitutivo (contrato social/estatuto) registrado na Junta Comercial?
- Partes: quem são os sócios/acionistas, percentual de participação?
- Tema do conflito: dissolução, apuração de haveres, exclusão de sócio, deadlock?
- Há acordo de sócios ou acordo de acionistas vigente?
- Balanço patrimonial mais recente: data de referência, patrimônio líquido
- Há ativos intangíveis, marcas, patentes, contratos relevantes a apurar?
- Existência de dívidas ou contingências passivas relevantes`;

    case "ambiental":
      return `QUESTÕES ESPECÍFICAS — DIREITO AMBIENTAL:
- Área de preservação permanente (APP) ou Reserva Legal envolvida?
- Licença ambiental existente (LP, LI, LO)? Vigência e órgão expedidor
- Houve autuação ou auto de infração ambiental? Número do processo administrativo
- Dano ambiental identificado: natureza (solo, água, fauna, flora), extensão estimada
- Há TAC (Termo de Ajustamento de Conduta) em vigor?
- CAR (Cadastro Ambiental Rural) registrado para o imóvel?
- Responsabilidade: o infrator é pessoa física, jurídica ou administrador?`;

    default:
      return `QUESTÕES ESPECÍFICAS — DIREITO CÍVEL / GERAL:
- Natureza do direito violado (obrigação de dar, fazer, não fazer, indenização)
- Prazo prescricional aplicável (CC, art. 205 = 10 anos regra geral; art. 206 = especiais)
- Existência de notificação extrajudicial prévia
- Documentos probatórios disponíveis: contratos, notas fiscais, recibos, e-mails`;
  }
}

export function buildExtracaoFatosPrompt(
  contexto: ContextoJuridicoPedido | null,
  tipoPeca: string,
  materia: MateriaCanonica = "civel",
): { system: string; prompt: string } {
  return {
    system: SYSTEM_PROMPT_BASE,
    prompt: `Extraia e organize os fatos jurídicos relevantes para uma "${tipoPeca}" na área de ${materia.toUpperCase()}.

CONTEXTO PROCESSADO ANTERIORMENTE:
${JSON.stringify(contexto ?? {}, null, 2)}

INSTRUÇÕES GERAIS:
1. Liste os fatos em ORDEM CRONOLÓGICA (do mais antigo ao mais recente)
2. Para cada fato: data (ou "sem data"), descrição objetiva, documentos que comprovam
3. Identifique explicitamente: prazo prescricional aplicável e prazo decadencial (se houver)
4. Destaque fatos CONTROVERSOS (que podem ser contestados pela parte adversa)
5. Responda as questões específicas da matéria abaixo

${buildQuestoesEspecificasPorMateria(materia)}

FORMATO DE RESPOSTA:
{
  "fatos_cronologicos": [
    {
      "data": "DD/MM/AAAA ou 'sem data'",
      "descricao": "Descrição objetiva do fato",
      "documentos_referenciados": ["DOC-001", "..."],
      "controverso": true
    }
  ],
  "prazo_prescricional": "X anos — fundamento: Art. XX do CC/CLT/CTN",
  "prazo_decadencial": "X anos — fundamento: Art. XX | ou: 'não identificado'",
  "dados_especificos_materia": {
    // campos relevantes para ${materia} conforme questões acima
  },
  "observacoes": "..."
}`,
  };
}
