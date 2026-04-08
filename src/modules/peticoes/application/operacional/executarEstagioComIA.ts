import "server-only";
import { streamText } from "ai";
import { getAIProvider, getDefaultModelId } from "@/lib/ai/client";
import { validateStageOutput } from "@/lib/ai/stage-output-validation";
import { obterPipelineDoPedido } from "@/modules/peticoes/application/obterPipelineDoPedido";
import { getPeticoesOperacionalInfra } from "@/modules/peticoes/infrastructure/operacional/provider.server";
import {
  type EstagioExecutavel,
  MAPA_ESTAGIO_PIPELINE,
} from "@/modules/peticoes/domain/types";

export type { EstagioExecutavel };
export { MAPA_ESTAGIO_PIPELINE };

function buildMockStageOutput(
  estagio: EstagioExecutavel,
  pipeline: Awaited<ReturnType<typeof obterPipelineDoPedido>>,
): string {
  switch (estagio) {
    case "triagem":
      return JSON.stringify({
        tipo_peca: "Petição inicial",
        materia: "Cível",
        polo_representado: "ativo",
        urgencia: "alta",
        complexidade: "média",
        justificativa_polo: "Cliente posicionado como autor na narrativa principal.",
        justificativa_urgencia: "Há risco de agravamento do dano em curto prazo.",
        justificativa_complexidade: "Contexto documental objetivo e fundamentos conhecidos.",
      });
    case "extracao-fatos":
      return JSON.stringify({
        fatos_cronologicos: [
          {
            data: "2026-01-15",
            descricao: "Inadimplemento contratual identificado em documento principal.",
            documentos_referenciados: ["DOC-MOCK-001"],
          },
          {
            data: "2026-02-02",
            descricao: "Notificação extrajudicial sem resposta formal da parte adversa.",
            documentos_referenciados: ["DOC-MOCK-002"],
          },
        ],
        observacoes: "Extração simulada para ambiente mock sem provedor de IA.",
      });
    case "analise-adversa":
      return JSON.stringify({
        pontos_fortes: [
          "Narrativa cronológica consistente com os documentos.",
          "Comprovação de tentativa prévia de solução extrajudicial.",
        ],
        pontos_vulneraveis: [
          "Base probatória limitada para quantificação integral dos danos.",
        ],
        argumentos_adversos_previstos: [
          "Alegação de inexistência de mora qualificada.",
        ],
        riscos_processuais: [
          "Possibilidade de dilação probatória em fase instrutória.",
        ],
        nivel_risco_geral: "médio",
        recomendacoes_cautela: "Reforçar prova documental de notificação e prejuízo imediato.",
      });
    case "estrategia":
      return JSON.stringify({
        teses_aplicaveis: [
          {
            titulo: "Responsabilidade por inadimplemento contratual",
            fundamento_legal: "Art. 389 do Código Civil",
            prioridade: "principal",
          },
          {
            titulo: "Tutela de urgência para cessação do dano",
            fundamento_legal: "Art. 300 do CPC",
            prioridade: "secundaria",
          },
        ],
        linha_argumentativa:
          "Demonstrar mora, dano contínuo e probabilidade do direito com base documental.",
        pedidos_recomendados: [
          "Concessão de tutela de urgência",
          "Condenação em perdas e danos",
        ],
      });
    case "minuta": {
      const estrategia = pipeline.contextoAtual?.estrategiaSugerida ??
        "Narrativa por fatos, fundamentos e pedidos com foco em tutela de urgência.";
      return [
        "EXCELENTISSIMO SENHOR DOUTOR JUIZ DE DIREITO",
        "",
        "I. DOS FATOS",
        "A parte autora demonstra inadimplemento contratual reiterado, com suporte em documentos anexos e cronologia objetiva dos eventos relevantes.",
        "",
        "II. DOS FUNDAMENTOS JURIDICOS",
        "A pretensao encontra respaldo na responsabilidade civil contratual e na necessidade de tutela jurisdicional efetiva para evitar agravamento do dano.",
        "",
        "III. DA ESTRATEGIA PROCESSUAL",
        estrategia,
        "",
        "IV. DOS PEDIDOS",
        "Requer-se tutela de urgencia, citacao da parte re e procedencia integral dos pedidos, com condenacao em custas e honorarios.",
      ].join("\n");
    }
  }
}

export async function executarEstagioMock(
  pedidoId: string,
  estagio: EstagioExecutavel,
  options?: {
    onFinalized?: (result: {
      status: "completed" | "failed";
      schemaValid: boolean;
      ragDegraded: boolean;
      errorMessage?: string;
    }) => Promise<void> | void;
  },
): Promise<ReadableStream<string>> {
  const pipeline = await obterPipelineDoPedido(pedidoId);
  const etapaPipeline = MAPA_ESTAGIO_PIPELINE[estagio];
  const infra = getPeticoesOperacionalInfra();

  await infra.pipelineSnapshotRepository.salvarNovaVersao({
    pedidoId,
    etapa: etapaPipeline,
    entradaRef: { origem: "mock_execution", estagio, ragDegraded: false },
    saidaEstruturada: {},
    status: "em_andamento",
    tentativa: 1,
  });

  const textoCompleto = buildMockStageOutput(estagio, pipeline);
  const validation = validateStageOutput(estagio, textoCompleto);
  const status = validation.schemaValid ? "concluido" : "erro";

  await infra.pipelineSnapshotRepository.salvarNovaVersao({
    pedidoId,
    etapa: etapaPipeline,
    entradaRef: { origem: "mock_execution", estagio, ragDegraded: false },
    saidaEstruturada: {
      textoGerado: textoCompleto,
      geradoPorIA: false,
      mockExecution: true,
      schemaValid: validation.schemaValid,
      ragDegraded: false,
      output: validation.structured,
      validationError: validation.validationError,
    },
    status,
    codigoErro: validation.schemaValid ? undefined : "SCHEMA_VALIDATION_FAILED",
    mensagemErro: validation.validationError,
    tentativa: 1,
  });

  await options?.onFinalized?.({
    status: validation.schemaValid ? "completed" : "failed",
    schemaValid: validation.schemaValid,
    ragDegraded: false,
    errorMessage: validation.validationError,
  });

  return new ReadableStream<string>({
    start(controller) {
      controller.enqueue(textoCompleto);
      if (!validation.schemaValid) {
        controller.enqueue(
          `\n\n[VALIDACAO_DE_SCHEMA_FALHOU] ${validation.validationError ?? "Saída não aderente ao contrato esperado."}`,
        );
      }
      controller.close();
    },
  });
}

export async function executarEstagioComIA(
  pedidoId: string,
  estagio: EstagioExecutavel,
  buildPromptFn: (pipeline: Awaited<ReturnType<typeof obterPipelineDoPedido>>) =>
    | { system: string; prompt: string }
    | Promise<{ system: string; prompt: string }>,
  options?: {
    ragDegraded?: boolean;
    onFinalized?: (result: {
      status: "completed" | "failed";
      schemaValid: boolean;
      ragDegraded: boolean;
      errorMessage?: string;
    }) => Promise<void> | void;
  },
): Promise<ReadableStream<string>> {
  const provider = getAIProvider();
  if (!provider) {
    throw new Error("AI não configurada. Defina OPENROUTER_API_KEY no ambiente.");
  }

  const pipeline = await obterPipelineDoPedido(pedidoId);
  const { system, prompt } = await buildPromptFn(pipeline);
  const etapaPipeline = MAPA_ESTAGIO_PIPELINE[estagio];
  const infra = getPeticoesOperacionalInfra();

  // Marcar estágio como em andamento
  await infra.pipelineSnapshotRepository.salvarNovaVersao({
    pedidoId,
    etapa: etapaPipeline,
    entradaRef: { origem: "ia_streaming", estagio, ragDegraded: options?.ragDegraded ?? false },
    saidaEstruturada: {},
    status: "em_andamento",
    tentativa: 1,
  });

  const { textStream, text: textPromise } = await streamText({
    model: provider(getDefaultModelId()),
    system,
    prompt,
    temperature: 0.3,
    maxOutputTokens: 4000,
  });

  const onComplete = async (textoCompleto: string) => {
    const validation = validateStageOutput(estagio, textoCompleto);
    const status = validation.schemaValid ? "concluido" : "erro";

    // NOTE: Using salvarNovaVersao directly (not sincronizarPipelinePedido)
    // because sincronizarPipelinePedido is a full orchestrator that reprocesses
    // ALL documents — not appropriate for persisting a single AI stage output.
    await infra.pipelineSnapshotRepository.salvarNovaVersao({
      pedidoId,
      etapa: etapaPipeline,
      entradaRef: { origem: "ia_streaming", estagio, ragDegraded: options?.ragDegraded ?? false },
      saidaEstruturada: {
        textoGerado: textoCompleto,
        geradoPorIA: true,
        schemaValid: validation.schemaValid,
        ragDegraded: options?.ragDegraded ?? false,
        output: validation.structured,
        validationError: validation.validationError,
      },
      status,
      codigoErro: validation.schemaValid ? undefined : "SCHEMA_VALIDATION_FAILED",
      mensagemErro: validation.validationError,
      tentativa: 1,
    });

    await options?.onFinalized?.({
      status: validation.schemaValid ? "completed" : "failed",
      schemaValid: validation.schemaValid,
      ragDegraded: options?.ragDegraded ?? false,
      errorMessage: validation.validationError,
    });

    return validation;
  };

  // Converter AsyncIterable para ReadableStream
  const stream = new ReadableStream<string>({
    async start(controller) {
      try {
        for await (const chunk of textStream) {
          controller.enqueue(chunk);
        }
        const textoCompleto = await textPromise;
        const validation = await onComplete(textoCompleto);
        if (!validation.schemaValid) {
          controller.enqueue(
            `\n\n[VALIDACAO_DE_SCHEMA_FALHOU] ${validation.validationError ?? "Saída não aderente ao contrato esperado."}`,
          );
        }
        controller.close();
      } catch (err) {
        try {
          await infra.pipelineSnapshotRepository.salvarNovaVersao({
            pedidoId,
            etapa: etapaPipeline,
            entradaRef: { origem: "ia_streaming", estagio, ragDegraded: options?.ragDegraded ?? false },
            saidaEstruturada: {},
            status: "erro",
            mensagemErro: err instanceof Error ? err.message : "Erro desconhecido",
            tentativa: 1,
          });
          await options?.onFinalized?.({
            status: "failed",
            schemaValid: false,
            ragDegraded: options?.ragDegraded ?? false,
            errorMessage: err instanceof Error ? err.message : "Erro desconhecido",
          });
        } finally {
          controller.enqueue(
            `\n\n[ERRO_DE_EXECUCAO] ${err instanceof Error ? err.message : "Erro desconhecido durante streaming."}`,
          );
          controller.close();
        }
      }
    },
  });

  return stream;
}
