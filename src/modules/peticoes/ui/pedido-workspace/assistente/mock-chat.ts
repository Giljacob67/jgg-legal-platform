import type { MensagemAssistente, AcaoRapida, ContextoCasoAssistente } from "./types";

export const ACOES_RAPIDAS: AcaoRapida[] = [
  {
    id: "analisar-documentos",
    titulo: "Analisar documentos",
    descricao: "Extrair fatos, provas e lacunas do material vinculado.",
    icone: "📄",
  },
  {
    id: "identificar-peca",
    titulo: "Identificar peça cabível",
    descricao: "Sugerir o tipo de peça mais adequada ao caso.",
    icone: "⚖️",
  },
  {
    id: "gerar-diagnostico",
    titulo: "Gerar diagnóstico",
    descricao: "Consolidar análise adversa, riscos e diretriz estratégica.",
    icone: "🔍",
  },
  {
    id: "sugerir-estrategia",
    titulo: "Sugerir estratégia",
    descricao: "Propor teses candidatas e alavancas argumentativas.",
    icone: "🎯",
  },
  {
    id: "redigir-minuta",
    titulo: "Redigir minuta",
    descricao: "Produzir rascunho da peça com estrutura jurídica.",
    icone: "✍️",
  },
  {
    id: "revisar-peca",
    titulo: "Revisar peça",
    descricao: "Checar coerência, referências e checklist de aprovação.",
    icone: "✅",
  },
];

export function gerarContextoMock(pedido: {
  casoId: string;
  tipoPeca: string;
  responsavel: string;
  status: string;
  prazoFinal: string;
}): ContextoCasoAssistente {
  return {
    cliente: pedido.casoId.split("-")[0]?.toUpperCase() ?? "Cliente",
    casoId: pedido.casoId,
    tipoPeca: pedido.tipoPeca,
    materia: "Cível Geral",
    polo: "Ativo",
    prazoFinal: pedido.prazoFinal,
    responsavel: pedido.responsavel || "Não atribuído",
    status: pedido.status,
  };
}

export function gerarMensagensIniciais(contexto: ContextoCasoAssistente): MensagemAssistente[] {
  return [
    {
      id: "msg-init-1",
      tipo: "sistema",
      conteudo: `Olá, sou o assistente jurídico do pedido. Estou com o caso **${contexto.casoId}** aberto.`,
      timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    },
    {
      id: "msg-init-2",
      tipo: "sistema",
      conteudo: `A peça prevista é **${contexto.tipoPeca}**, com prazo em **${contexto.prazoFinal}**. Responsável atual: **${contexto.responsavel}**.`,
      timestamp: new Date(Date.now() - 1000 * 60 * 4).toISOString(),
    },
    {
      id: "msg-init-3",
      tipo: "sistema",
      conteudo:
        "Posso ajudar com análise documental, identificação da peça cabível, diagnóstico estratégico, sugestão de teses, redação de minuta ou revisão jurídica. Escolha uma ação rápida ou digite sua pergunta.",
      timestamp: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
    },
  ];
}

export function gerarRespostaAcao(acaoId: string, contexto: ContextoCasoAssistente): MensagemAssistente[] {
  switch (acaoId) {
    case "analisar-documentos":
      return [
        {
          id: `msg-${acaoId}-1`,
          tipo: "acao",
          titulo: "Análise documental concluída",
          conteudo:
            "Foram identificados 4 documentos relevantes: contrato de prestação de serviços, notificações extrajudiciais, contestação da parte contrária e nota fiscal. A cobertura probatória é moderada. Há 1 lacuna: o e-mail de comunicação prévia de rescisão não foi localizado.",
          acaoId,
          timestamp: new Date().toISOString(),
        },
      ];
    case "identificar-peca":
      return [
        {
          id: `msg-${acaoId}-1`,
          tipo: "acao",
          titulo: "Peça cabível identificada",
          conteudo: `Para o caso **${contexto.casoId}**, com base na matéria ${contexto.materia} e no polo ${contexto.polo}, a peça mais adequada é **${contexto.tipoPeca}**. Alternativas: Contestação (se o cliente for réu) ou Manifestação (se houver necessidade de esclarecimento processual).`,
          acaoId,
          timestamp: new Date().toISOString(),
        },
      ];
    case "gerar-diagnostico":
      return [
        {
          id: `msg-${acaoId}-1`,
          tipo: "diagnostico",
          titulo: "Diagnóstico estratégico",
          conteudo:
            "Diretriz principal: reforçar a inadimplência contratual como fato incontroverso, neutralizando a alegação de caso fortuito. Alavancas: contrato assinado, notificações extrajudiciais, inadimplemento de 3 parcelas. Fragilidades: falta de comprovação do e-mail de rescisão; perícia técnica da parte contrária contestando o valor do dano.",
          acaoId,
          timestamp: new Date().toISOString(),
        },
        {
          id: `msg-${acaoId}-2`,
          tipo: "alerta",
          titulo: "Risco processual médio",
          conteudo:
            "A parte contrária pode explorar a falta de comprovação do e-mail de rescisão para caracterizar rescisão unilateral sem justa causa. Recomenda-se diligência para recuperar o e-mail ou obter testemunho.",
          acaoId,
          timestamp: new Date().toISOString(),
        },
      ];
    case "sugerir-estrategia":
      return [
        {
          id: `msg-${acaoId}-1`,
          tipo: "acao",
          titulo: "Teses candidatas",
          conteudo:
            "1. Tese principal: inadimplemento contratual com pedido de rescisão por culpa da parte contrária (art. 475 do CC). 2. Tese subsidiária: rescisão por descumprimento de obrigação essencial (art. 475, § 1º, CC). 3. Tese de reparação de danos materiais com base na nota fiscal e orçamento.",
          acaoId,
          timestamp: new Date().toISOString(),
        },
      ];
    case "redigir-minuta":
      return [
        {
          id: `msg-${acaoId}-1`,
          tipo: "minuta",
          titulo: "Rascunho de minuta gerado",
          conteudo:
            "EXCELENTÍSSIMO SENHOR DOUTOR JUIZ DE DIREITO DA __ª VARA CÍVEL DA COMARCA DE ___.\n\n[Qualificação das partes]\n\nVem o autor, por seu advogado infra-assinado, perante Vossa Excelência, com fulcro no art. 475 do Código Civil, propor a presente AÇÃO DE RESCISÃO CONTRATUAL C/C PEDIDO DE INDENIZAÇÃO POR DANOS MATERIAIS em face do réu, pelos fatos e fundamentos a seguir expostos.\n\nI – DOS FATOS\n\n1. As partes celebraram contrato de prestação de serviços em 15/03/2023...",
          acaoId,
          timestamp: new Date().toISOString(),
        },
      ];
    case "revisar-peca":
      return [
        {
          id: `msg-${acaoId}-1`,
          tipo: "acao",
          titulo: "Revisão jurídica concluída",
          conteudo:
            "Checklist de revisão: cabeçalho OK, qualificação das partes OK, síntese fática OK (com ressalva do e-mail não comprovado), fundamentos jurídicos OK (art. 475 CC citado), pedidos OK. Pendência: inserir número da vara e comarca; verificar se o valor da causa está atualizado.",
          acaoId,
          timestamp: new Date().toISOString(),
        },
      ];
    default:
      return [
        {
          id: `msg-${acaoId}-default`,
          tipo: "sistema",
          conteudo: "Ação em desenvolvimento. Por favor, use o pipeline técnico para esta etapa.",
          acaoId,
          timestamp: new Date().toISOString(),
        },
      ];
  }
}

export function gerarRespostaTextoLivre(texto: string): MensagemAssistente {
  const lower = texto.toLowerCase();

  if (lower.includes("prazo") || lower.includes("urgência")) {
    return {
      id: `msg-livre-${Date.now()}`,
      tipo: "sistema",
      conteudo:
        "O prazo deste pedido está sendo monitorado. Se houver risco de vencimento em menos de 3 dias, recomendo priorizar a triagem e a distribuição do responsável. Quer que eu gere um diagnóstico acelerado?",
      timestamp: new Date().toISOString(),
    };
  }

  if (lower.includes("documento") || lower.includes("prova")) {
    return {
      id: `msg-livre-${Date.now()}`,
      tipo: "sistema",
      conteudo:
        "Sobre documentos e provas: a matriz de fatos e provas já identifica lacunas e força probatória. Posso analisar os documentos vinculados ou sugerir o que está faltando para sustentar a tese principal.",
      timestamp: new Date().toISOString(),
    };
  }

  if (lower.includes("tese") || lower.includes("estrategia")) {
    return {
      id: `msg-livre-${Date.now()}`,
      tipo: "sistema",
      conteudo:
        "A estratégia do caso depende da qualidade da base factual. Recomendo primeiro analisar os documentos e a matriz de fatos. Depois, posso sugerir teses candidatas com base no diagnóstico estratégico.",
      timestamp: new Date().toISOString(),
    };
  }

  return {
    id: `msg-livre-${Date.now()}`,
    tipo: "sistema",
    conteudo: `Entendido: "${texto}". Para avançar de forma estruturada, sugiro usar uma das ações rápidas acima ou navegar pelas seções do workspace (Briefing, Documentos, Fatos e Provas, Teses).`,
    timestamp: new Date().toISOString(),
  };
}
