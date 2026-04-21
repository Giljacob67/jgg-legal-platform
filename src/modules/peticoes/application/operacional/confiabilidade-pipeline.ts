import type { SnapshotPipelineEtapa } from "@/modules/peticoes/domain/types";

export const JANELA_BLOQUEIO_EXECUCAO_ANDAMENTO_MS = 15 * 60 * 1000;
const LIMITE_MENSAGEM_ERRO = 900;

export type FalhaPipelineClassificada = {
  codigoErro: string;
  statusHttp: number;
  reprocessavel: boolean;
  mensagemOperacional: string;
  mensagemTecnica: string;
};

function normalizarMensagemErro(error: unknown): string {
  const mensagem = error instanceof Error ? error.message : String(error);
  if (mensagem.length <= LIMITE_MENSAGEM_ERRO) return mensagem;
  return `${mensagem.slice(0, LIMITE_MENSAGEM_ERRO - 3)}...`;
}

export function classificarFalhaPipeline(error: unknown): FalhaPipelineClassificada {
  const mensagemTecnica = normalizarMensagemErro(error);
  const mensagem = mensagemTecnica.toLowerCase();

  if (
    mensagem.includes("contexto jurídico não disponível")
    || mensagem.includes("contexto juridico não disponível")
    || mensagem.includes("contexto juridico nao disponivel")
  ) {
    return {
      codigoErro: "CONTEXTO_JURIDICO_INDISPONIVEL",
      statusHttp: 422,
      reprocessavel: true,
      mensagemOperacional:
        "Contexto jurídico ainda não consolidado para esta etapa. Execute os estágios anteriores e tente novamente.",
      mensagemTecnica,
    };
  }

  if (
    mensagem.includes("timeout")
    || mensagem.includes("timed out")
    || mensagem.includes("temporar")
    || mensagem.includes("overload")
    || mensagem.includes("429")
    || mensagem.includes("econnreset")
    || mensagem.includes("socket hang up")
  ) {
    return {
      codigoErro: "FALHA_TRANSITORIA_IA",
      statusHttp: 503,
      reprocessavel: true,
      mensagemOperacional:
        "Falha temporária no provedor de IA. Aguarde alguns minutos e tente reprocessar esta etapa.",
      mensagemTecnica,
    };
  }

  if (
    mensagem.includes("openrouter_api_key")
    || mensagem.includes("api key")
    || mensagem.includes("unauthorized")
    || mensagem.includes("não configurada")
    || mensagem.includes("nao configurada")
  ) {
    return {
      codigoErro: "IA_NAO_CONFIGURADA",
      statusHttp: 503,
      reprocessavel: false,
      mensagemOperacional:
        "A integração de IA não está configurada corretamente. Solicite ajuste da configuração antes de reprocessar.",
      mensagemTecnica,
    };
  }

  return {
    codigoErro: "PIPELINE_EXECUCAO_FALHA",
    statusHttp: 500,
    reprocessavel: true,
    mensagemOperacional:
      "Falha ao executar o estágio do pipeline. Revise os dados de entrada e tente novamente.",
    mensagemTecnica,
  };
}

export function existeExecucaoEmAndamentoRecente(
  snapshot: SnapshotPipelineEtapa | null | undefined,
  agora = Date.now(),
): boolean {
  if (!snapshot || snapshot.status !== "em_andamento") return false;
  const executadoEm = Date.parse(snapshot.executadoEm);
  if (Number.isNaN(executadoEm)) return false;
  return agora - executadoEm < JANELA_BLOQUEIO_EXECUCAO_ANDAMENTO_MS;
}
