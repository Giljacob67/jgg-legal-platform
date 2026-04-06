import { NextResponse } from "next/server";
import { generateObject } from "ai";
import { z } from "zod";
import { getLLM, isAIAvailable } from "@/lib/ai/provider";
import { services } from "@/services/container";
import { detectarPoloRepresentado } from "@/modules/casos/domain/types";
import type { TipoPeca, PrioridadePedido, IntencaoProcessual } from "@/modules/peticoes/domain/types";
import { requireAuth } from "@/lib/api-auth";

const TriagemSchema = z.object({
  poloDetectado: z.enum(["ativo", "passivo", "indefinido"]).describe(
    "Polo que o escritório representa: 'ativo' = representa o autor/demandante, 'passivo' = representa o réu/requerido"
  ),
  justificativaPolo: z.string().describe(
    "Explicação de 1 linha sobre como o polo foi determinado a partir das partes e documentos"
  ),
  tipoPecaClassificado: z.string().describe("Tipo de peça jurídica mais adequada para este pedido"),
  intencaoDetectada: z.enum([
    "redigir_contestacao",
    "redigir_impugnacao",
    "redigir_replica",
    "redigir_embargos",
    "redigir_excecao_executividade",
    "redigir_peticao_inicial",
    "redigir_recurso",
    "redigir_agravo",
    "redigir_mandado_seguranca",
    "analisar_documento_adverso",
    "extrair_fatos",
    "mapear_prazos",
    "avaliar_riscos",
    "redigir_peticao_avulsa",
  ]).describe("Objetivo processual detectado: o que o agente deve FAZER com o documento"),
  prioridade: z.enum(["alta", "média", "baixa"]).describe(
    "Prioridade baseada no prazo e urgência"
  ),
  prazoSugerido: z.string().describe("Prazo sugerido no formato YYYY-MM-DD"),
  responsavelSugerido: z.string().describe("Advogado interno mais adequado por especialidade na matéria"),
  resumoJustificativa: z.string().describe("Justificativa da classificação em 3-4 linhas, já orientada para o polo representado"),
  alertas: z.array(z.string()).describe("Alertas críticos: prazos, documentação faltante, vulnerabilidades"),
  pontosVulneraveisAdverso: z.array(z.string()).describe(
    "Pontos vulneráveis identificados no documento da parte adversa, se aplicável (máx. 5)"
  ),
  etapaInicial: z.string().describe("Etapa inicial do pipeline: 'classificacao' ou 'leitura_documental'"),
});

const EQUIPE_JGG = [
  { nome: "Dr. Gilberto Jacob", especialidades: ["Agrário", "Empresarial", "Cível Empresarial", "Bancário"] },
  { nome: "Dra. Ana Beatriz Santos", especialidades: ["Trabalhista", "Consumidor", "Família", "Cível"] },
  { nome: "Dr. Carlos Mendes", especialidades: ["Tributário", "Bancário", "Empresarial", "Previdenciário"] },
  { nome: "Dra. Fernanda Lima", especialidades: ["Criminal", "Ambiental", "Agrário", "Constitutional"] },
];

function construirContextoPolo(polo: "ativo" | "passivo" | "indefinido"): string {
  if (polo === "ativo") {
    return `O ESCRITÓRIO REPRESENTA O POLO ATIVO (AUTOR/DEMANDANTE).
Isso significa que:
- A análise deve identificar como FORTALECER a narrativa do cliente-autor
- Vulnerabilidades a detectar são as do RÉU (defesas previsíveis, argumentos fracos)
- A peça deve ser OFENSIVA: provar fatos, fundamentar direitos, pedir condenação
- Prazos prioritários: impetração, protocolos, tutelas de urgência`;
  }

  if (polo === "passivo") {
    return `O ESCRITÓRIO REPRESENTA O POLO PASSIVO (RÉU/REQUERIDO).
Isso significa que:
- A análise deve identificar como NEUTRALIZAR ou REFUTAR a narrativa do autor
- Vulnerabilidades a detectar são as da PETIÇÃO DO AUTOR (falhas probatórias, prazos, ilegitimidades)
- A peça deve ser DEFENSIVA: questionar pressupostos, apresentar contradita, exceções processuais
- Prazos prioritários: contestação (15 dias JEC / 30 dias CPC), embargos, exceções`;
  }

  return `O POLO NÃO FOI DETERMINADO AUTOMATICAMENTE.
Por segurança, analise AMBAS as perspectivas e sinalize que o advogado deve confirmar qual polo representa.`;
}

export async function POST(request: Request) {
  const unauth = await requireAuth();
  if (unauth) return unauth;

  try {
    const body = await request.json();
    const {
      casoId,
      descricaoProblema,
      prazoInformadoCliente,
      documentosAnexados,
      textoDocumentoAdverso,
      intencaoExplicita,
    } = body as {
      casoId: string;
      descricaoProblema: string;
      prazoInformadoCliente?: string;
      documentosAnexados?: string[];
      textoDocumentoAdverso?: string;
      intencaoExplicita?: IntencaoProcessual;
    };

    if (!casoId || !descricaoProblema) {
      return NextResponse.json(
        { error: "casoId e descricaoProblema são obrigatórios." },
        { status: 400 }
      );
    }

    const caso = await services.casosRepository.obterCasoPorId(casoId);
    if (!caso) {
      return NextResponse.json({ error: `Caso ${casoId} não encontrado.` }, { status: 404 });
    }

    const poloDetectado = detectarPoloRepresentado(caso);
    const contextoPolo = construirContextoPolo(poloDetectado);

    const equipeStr = EQUIPE_JGG.map(
      (m) => `- ${m.nome}: ${m.especialidades.join(", ")}`
    ).join("\n");

    const intencaoContexto = intencaoExplicita
      ? `\n## Intenção Explícita do Advogado\nO advogado JÁ INDICOU que quer: "${intencaoExplicita}". Respeite essa intenção.`
      : `\n## Intenção a Detectar\nO advogado NÃO informou a intenção. Detecte a partir do documento e do contexto.`;

    const textoAdversoContexto = textoDocumentoAdverso
      ? `\n## Texto do Documento Adverso (OCR)\n${textoDocumentoAdverso.slice(0, 3000)}...`
      : "";

    const prompt = `Você é o sistema de triagem jurídica inteligente da JGG Advocacia. Retorne SEMPRE uma resposta em JSON válido conforme o schema fornecido.

## CONTEXTO CRÍTICO DE POLO
${contextoPolo}

## Detalhes do Caso
- ID: ${caso.id}
- Título: ${caso.titulo}
- Cliente (quem o escritório representa): **${caso.cliente}**
- Matéria: ${caso.materia}
- Tribunal: ${caso.tribunal}
- Status atual: ${caso.status}
- Prazo do caso: ${caso.prazoFinal}
- Partes: ${caso.partes.map((p) => `${p.nome} (${p.papel})`).join(", ")}
- Resumo: ${caso.resumo}

## Problema / Contexto descrito pelo advogado
${descricaoProblema}

## Prazo Informado pelo Cliente
${prazoInformadoCliente ?? "Não informado"}

## Documentos Disponíveis
${documentosAnexados?.join(", ") ?? "Nenhum documento anexado"}
${textoAdversoContexto}
${intencaoContexto}

## Equipe Disponível
${equipeStr}

## Instruções de Triagem
1. Confirme ou corrija o polo represetado com base nas partes e descrição
2. Detecte a intenção processual mais adequada (o que fazer com o documento)
3. Classifique o tipo de peça necessária
4. Identifique pontos vulneráveis do adversário (máx. 5)
5. Defina prioridade real considerando o tribunal e prazo
6. Sinalize alertas críticos`;

    if (!isAIAvailable()) {
      const today = new Date();
      const prazoDefault = new Date(today.setDate(today.getDate() + 10)).toISOString().split("T")[0];

      const intencaoMock: IntencaoProcessual = intencaoExplicita ??
        (poloDetectado === "passivo" ? "redigir_contestacao" : "analisar_documento_adverso");

      return NextResponse.json({
        casoId,
        modo: "mock",
        aviso: "OPENAI_API_KEY não configurada — resultado simulado.",
        polo: poloDetectado,
        triagem: {
          poloDetectado,
          justificativaPolo: `Cliente "${caso.cliente}" identificado como ${poloDetectado === "ativo" ? "autor" : poloDetectado === "passivo" ? "réu" : "polo não identificado"} nas partes do caso.`,
          tipoPecaClassificado: poloDetectado === "passivo" ? "Contestação" : "Petição inicial",
          intencaoDetectada: intencaoMock,
          prioridade: "alta" as PrioridadePedido,
          prazoSugerido: prazoDefault,
          responsavelSugerido: EQUIPE_JGG[0].nome,
          resumoJustificativa: `Caso ${caso.materia} representando o polo ${poloDetectado}. Configure OPENAI_API_KEY para análise real.`,
          alertas: ["Configurar OPENAI_API_KEY para triagem real com IA", "Confirmar polo processual manualmente"],
          pontosVulneraveisAdverso: [],
          etapaInicial: "classificacao",
        },
      });
    }

    const { object: triagem } = await generateObject({
      model: getLLM(),
      schema: TriagemSchema,
      prompt,
    });

    const novoPedido = await services.peticoesRepository.simularCriacaoPedido({
      casoId,
      titulo: `${triagem.tipoPecaClassificado} — ${caso.titulo}`,
      tipoPeca: triagem.tipoPecaClassificado as TipoPeca,
      prioridade: triagem.prioridade,
      prazoFinal: triagem.prazoSugerido,
      intencaoProcessual: triagem.intencaoDetectada,
    });

    return NextResponse.json({
      casoId,
      modo: "ai",
      pedidoCriado: novoPedido.id,
      polo: triagem.poloDetectado,
      triagem,
    });

  } catch (error) {
    console.error("[Agente Triagem] Erro:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro interno no agente de triagem." },
      { status: 500 }
    );
  }
}
