import type { PedidoDePeca } from "@/modules/peticoes/domain/types";
import type { ItemMatrizFatoProva } from "@/modules/peticoes/domain/fatos-provas";

/**
 * Gera uma matriz de fatos e provas mockada coerente com o pedido.
 * Usada quando o pipeline ainda não produziu a matriz real.
 */
export function gerarMockMatrizFatosProvas(pedido: PedidoDePeca): ItemMatrizFatoProva[] {
  const materia = (pedido.tipoPeca ?? "").toLowerCase();

  if (materia.includes("trabalhista") || materia.includes("reclamação")) {
    return mockTrabalhista();
  }

  if (materia.includes("agrário") || materia.includes("rural") || materia.includes("posse")) {
    return mockAgrario();
  }

  if (materia.includes("tributário") || materia.includes("fiscal")) {
    return mockTributario();
  }

  if (materia.includes("família") || materia.includes("divórcio") || materia.includes("guarda")) {
    return mockFamilia();
  }

  if (materia.includes("criminal") || materia.includes("habeas")) {
    return mockCriminal();
  }

  return mockCivel();
}

function mockCivel(): ItemMatrizFatoProva[] {
  return [
    {
      id: "fp-mock-001",
      fato: "Contrato de prestação de serviços firmado em 15/03/2023 entre as partes, com cláusula de exclusividade.",
      classificacao: "comprovado",
      fonte: "Contrato de Prestação de Serviços",
      documentoRelacionado: { documentoId: "doc-001", titulo: "Contrato de Prestação de Serviços", tipoDocumento: "Contrato" },
      forcaProbativa: "alta",
      riscoAssociado: "baixo",
      recomendacaoUso: "usar",
      observacaoJuridica: "Documento assinado por ambas as partes. Art. 104 do CC.",
    },
    {
      id: "fp-mock-002",
      fato: "Inadimplemento das obrigações contratuais a partir de agosto/2023, com descumprimento de 3 parcelas.",
      classificacao: "comprovado",
      fonte: "Notificações extrajudiciais e comprovantes de inadimplemento",
      documentoRelacionado: { documentoId: "doc-002", titulo: "Notificações Extrajudiciais", tipoDocumento: "Comprovante" },
      forcaProbativa: "alta",
      riscoAssociado: "baixo",
      recomendacaoUso: "usar",
    },
    {
      id: "fp-mock-003",
      fato: "A parte contrária alega que o inadimplemento decorreu de caso fortuito (enchente no estabelecimento).",
      classificacao: "alegado_pelo_cliente",
      fonte: "Declaração verbal do cliente em consulta inicial",
      forcaProbativa: "baixa",
      riscoAssociado: "medio",
      recomendacaoUso: "usar_com_cautela",
      observacaoJuridica: "Exige confirmação documental. Se comprovado, afeta a tese de inadimplemento.",
    },
    {
      id: "fp-mock-004",
      fato: "A parte contrária apresentou documento de perícia técnica contestando o valor dos danos.",
      classificacao: "extraido_documento_adverso",
      fonte: "Contestação anexada ao processo",
      documentoRelacionado: { documentoId: "doc-003", titulo: "Contestação", tipoDocumento: "Petição" },
      forcaProbativa: "media",
      riscoAssociado: "medio",
      recomendacaoUso: "usar_com_cautela",
      observacaoJuridica: "Perícia contratada pela parte adversa. Sugere perícia judicial para neutralização.",
    },
    {
      id: "fp-mock-005",
      fato: "Existência de dano material no valor de R$ 45.000,00 decorrente da rescisão antecipada.",
      classificacao: "controvertido",
      fonte: "Nota fiscal e orçamento de reparo",
      documentoRelacionado: { documentoId: "doc-004", titulo: "Nota Fiscal e Orçamento", tipoDocumento: "Comprovante" },
      forcaProbativa: "media",
      riscoAssociado: "alto",
      recomendacaoUso: "pedir_complemento",
      observacaoJuridica: "O valor do dano é controvertido. Necessário laudo técnico ou perícia judicial.",
    },
    {
      id: "fp-mock-006",
      fato: "Comunicação prévia de rescisão foi realizada por e-mail em 10/08/2023.",
      classificacao: "lacuna_probatoria",
      fonte: "Alegação do cliente — e-mail não localizado",
      forcaProbativa: "baixa",
      riscoAssociado: "medio",
      recomendacaoUso: "nao_usar_ainda",
      observacaoJuridica: "E-mail alegado não foi recuperado. Se não comprovado, a rescisão pode ser considerada unilateral sem justa causa.",
    },
  ];
}

function mockTrabalhista(): ItemMatrizFatoProva[] {
  return [
    {
      id: "fp-trab-001",
      fato: "Relação de emprego com início em 02/01/2020, sem registro em CTPS nos primeiros 6 meses.",
      classificacao: "comprovado",
      fonte: "CTPS e holerites",
      documentoRelacionado: { documentoId: "doc-t01", titulo: "CTPS e Holerites", tipoDocumento: "Comprovante" },
      forcaProbativa: "alta",
      riscoAssociado: "baixo",
      recomendacaoUso: "usar",
      observacaoJuridica: "Reconhecimento de vínculo presumido. Art. 9º da CLT.",
    },
    {
      id: "fp-trab-002",
      fato: "Jornada diária de 10 horas sem intervalo de almoço remunerado.",
      classificacao: "alegado_pelo_cliente",
      fonte: "Relato do empregado e testemunhas",
      forcaProbativa: "media",
      riscoAssociado: "medio",
      recomendacaoUso: "usar_com_cautela",
      observacaoJuridica: "Requer cartão de ponto ou testemunho. Súmula 437 do TST.",
    },
    {
      id: "fp-trab-003",
      fato: "Empregador alega que o empregado exercia função de confiança, excluindo horas extras.",
      classificacao: "extraido_documento_adverso",
      fonte: "Contestação trabalhista",
      documentoRelacionado: { documentoId: "doc-t02", titulo: "Contestação", tipoDocumento: "Petição" },
      forcaProbativa: "media",
      riscoAssociado: "alto",
      recomendacaoUso: "usar_com_cautela",
      observacaoJuridica: "Função de confiança deve ser comprovada por atribuições efectivas. Súmula 435 do TST.",
    },
    {
      id: "fp-trab-004",
      fato: "Valor das horas extras devidas no período — cálculo ainda não apresentado.",
      classificacao: "lacuna_probatoria",
      fonte: "Não disponível",
      forcaProbativa: "baixa",
      riscoAssociado: "medio",
      recomendacaoUso: "nao_usar_ainda",
      observacaoJuridica: "Necessário cálculo pericial ou contador judicial para quantificação.",
    },
  ];
}

function mockAgrario(): ItemMatrizFatoProva[] {
  return [
    {
      id: "fp-agr-001",
      fato: "Posse direta e ostensiva da área de 45 hectares desde 1998, com benfeitorias construídas.",
      classificacao: "comprovado",
      fonte: "Certidão de registro de imóveis e fotos aéreas",
      documentoRelacionado: { documentoId: "doc-a01", titulo: "Certidão de Registro", tipoDocumento: "Comprovante" },
      forcaProbativa: "alta",
      riscoAssociado: "baixo",
      recomendacaoUso: "usar",
      observacaoJuridica: "Posse mansa e pacífica por mais de 20 anos. Art. 1.238 do CC.",
    },
    {
      id: "fp-agr-002",
      fato: "Reintegração de posse ajuizada pela instituição financeira em 2022, com liminar concedida.",
      classificacao: "extraido_documento_adverso",
      fonte: "Mandado de reintegração de posse",
      documentoRelacionado: { documentoId: "doc-a02", titulo: "Mandado de Reintegração", tipoDocumento: "Petição" },
      forcaProbativa: "alta",
      riscoAssociado: "alto",
      recomendacaoUso: "usar_com_cautela",
      observacaoJuridica: "Liminar já concedida. Urgência em impugnar com base na impenhorabilidade (Lei 8.009/90).",
    },
    {
      id: "fp-agr-003",
      fato: "Alegação de que o imóvel não constitui pequena propriedade rural para fins de impenhorabilidade.",
      classificacao: "controvertido",
      fonte: "Alegação da parte contrária",
      forcaProbativa: "media",
      riscoAssociado: "alto",
      recomendacaoUso: "pedir_complemento",
      observacaoJuridica: "Requer certificado de cadastro de imóvel (CCIR) e comprovação de renda familiar.",
    },
    {
      id: "fp-agr-004",
      fato: "Renda familiar bruta anual — dados faltantes para cálculo do limite de impenhorabilidade.",
      classificacao: "lacuna_probatoria",
      fonte: "Não disponível",
      forcaProbativa: "baixa",
      riscoAssociado: "alto",
      recomendacaoUso: "nao_usar_ainda",
      observacaoJuridica: "Lei 8.009/90, § 1º. Sem comprovação de renda, não há base para impenhorabilidade.",
    },
  ];
}

function mockTributario(): ItemMatrizFatoProva[] {
  return [
    {
      id: "fp-trib-001",
      fato: "Lançamento tributário do ICMS efetuado em 2021 sobre operação interestadual já tributada no estado de origem.",
      classificacao: "comprovado",
      fonte: "Nota fiscal e guia de recolhimento",
      documentoRelacionado: { documentoId: "doc-tr01", titulo: "Nota Fiscal e Guia", tipoDocumento: "Comprovante" },
      forcaProbativa: "alta",
      riscoAssociado: "baixo",
      recomendacaoUso: "usar",
      observacaoJuridica: "Não-cumulatividade do ICMS. Art. 155, § 2º, I, CF.",
    },
    {
      id: "fp-trib-002",
      fato: "Autarquia fiscal alega que a operação configura disguised sale, não transferência definitiva.",
      classificacao: "extraido_documento_adverso",
      fonte: "Auto de infração e parecer técnico",
      documentoRelacionado: { documentoId: "doc-tr02", titulo: "Auto de Infração", tipoDocumento: "Parecer" },
      forcaProbativa: "media",
      riscoAssociado: "medio",
      recomendacaoUso: "usar_com_cautela",
      observacaoJuridica: "Requer análise da natureza jurídica da operação. Posição divergente entre os tribunais.",
    },
    {
      id: "fp-trib-003",
      fato: "Documentação comprobatória do encerramento da atividade no estado de destino.",
      classificacao: "lacuna_probatoria",
      fonte: "Não localizado",
      forcaProbativa: "baixa",
      riscoAssociado: "medio",
      recomendacaoUso: "nao_usar_ainda",
      observacaoJuridica: "Sem comprovação de encerramento, a Fazenda pode arguir continuidade do débito.",
    },
  ];
}

function mockFamilia(): ItemMatrizFatoProva[] {
  return [
    {
      id: "fp-fam-001",
      fato: "União estável iniciada em 2015, com convivência pública, contínua e com filhos em comum.",
      classificacao: "comprovado",
      fonte: "Certidão de nascimento dos filhos e comprovantes de residência",
      documentoRelacionado: { documentoId: "doc-f01", titulo: "Certidões e Comprovantes", tipoDocumento: "Comprovante" },
      forcaProbativa: "alta",
      riscoAssociado: "baixo",
      recomendacaoUso: "usar",
      observacaoJuridica: "Presunção de união estável. Art. 1.723 do CC.",
    },
    {
      id: "fp-fam-002",
      fato: "Renda mensal do companheiro é de aproximadamente R$ 12.000,00, mas sem comprovação formal.",
      classificacao: "alegado_pelo_cliente",
      fonte: "Relato da parte",
      forcaProbativa: "media",
      riscoAssociado: "medio",
      recomendacaoUso: "usar_com_cautela",
      observacaoJuridica: "Requer declaração de imposto de renda ou extratos bancários.",
    },
    {
      id: "fp-fam-003",
      fato: "Parte contrária alega que a separação de fato ocorreu em 2020, interrompendo a união estável.",
      classificacao: "controvertido",
      fonte: "Contestação",
      forcaProbativa: "media",
      riscoAssociado: "alto",
      recomendacaoUso: "pedir_complemento",
      observacaoJuridica: "Data da separação de fato é fato controvertido. Requer prova testemunhal ou documental.",
    },
  ];
}

function mockCriminal(): ItemMatrizFatoProva[] {
  return [
    {
      id: "fp-crim-001",
      fato: "Prisão em flagrante ocorrida em 15/04/2024, sem presença de advogado no momento da oitiva.",
      classificacao: "comprovado",
      fonte: "Termo de prisão em flagrante e auto de apreensão",
      documentoRelacionado: { documentoId: "doc-c01", titulo: "Termo de Prisão", tipoDocumento: "Petição" },
      forcaProbativa: "alta",
      riscoAssociado: "baixo",
      recomendacaoUso: "usar",
      observacaoJuridica: "Ausência de defensor no momento da prisão em flagrante. Art. 5º, LXIII, CF.",
    },
    {
      id: "fp-crim-002",
      fato: "Alegação de que a droga apreendida não estava sob a posse direta do paciente.",
      classificacao: "alegado_pelo_cliente",
      fonte: "Relato do paciente",
      forcaProbativa: "media",
      riscoAssociado: "alto",
      recomendacaoUso: "usar_com_cautela",
      observacaoJuridica: "Posse direta é elemento do crime de tráfico. Requer análise do auto de apreensão.",
    },
    {
      id: "fp-crim-003",
      fato: "Laudo pericial da droga ainda não disponível — quantidade e pureza não confirmadas.",
      classificacao: "lacuna_probatoria",
      fonte: "Processo em andamento",
      forcaProbativa: "baixa",
      riscoAssociado: "alto",
      recomendacaoUso: "nao_usar_ainda",
      observacaoJuridica: "Quantidade e pureza afetam a tipificação (art. 33 vs. art. 28 da Lei 11.343/06).",
    },
  ];
}
