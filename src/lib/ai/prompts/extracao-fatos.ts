import { SYSTEM_PROMPT_BASE } from "./base";
import type { ContextoJuridicoPedido } from "@/modules/peticoes/domain/types";
import type { MateriaCanonica } from "@/modules/peticoes/domain/geracao-minuta";

/** Perguntas de extração específicas por matéria — complementam as perguntas gerais */
function buildQuestoesEspecificasPorMateria(materia: MateriaCanonica): string {
  switch (materia) {
    case "agrario":
      return `QUESTÕES ESPECÍFICAS — DIREITO AGRÁRIO / AGRONEGÓCIO:
- Identificar o imóvel rural: CCIR n.º, CAR (Cadastro Ambiental Rural), matrícula do imóvel, módulo fiscal da região
- Confirmar a destinação do imóvel (agricultura, pecuária, mista) e se há exploração efetiva
- Registrar safra(s) em disputa: ano-safra, cultura plantada, estimativa de produção
- Verificar existência de CPR (Cédula de Produto Rural): tipo (física/financeira), data de emissão, data de liquidação
- Verificar existência de CCR (Cédula de Crédito Rural): banco emitente, data, valor, garantias
- Identificar contrato de arrendamento ou parceria: prazo, valor, forma de pagamento (reais ou sacas)
- Existência de notificação extrajudicial de retomada ou cobrança? (data e forma)
- Há benfeitorias realizadas pelo arrendatário/parceiro? Foram autorizadas?`;

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
