import { generateText } from "ai";
import { requireAuth } from "@/lib/api-auth";
import { auth } from "@/lib/auth";
import { getLLM, isAIAvailable } from "@/lib/ai/provider";
import { syncRuntimeAIConfig } from "@/lib/ai/runtime-config";
import { verificarRateLimit } from "@/lib/rate-limit";
import { services } from "@/services/container";
import { listarDocumentos } from "@/modules/documentos/application/listarDocumentos";
import { getPeticoesOperacionalInfra } from "@/modules/peticoes/infrastructure/operacional/provider.server";
import { detectarPoloRepresentado } from "@/modules/casos/domain/types";
import {
  getRequestId,
  jsonError,
  jsonWithRequestId,
  logApiError,
  logApiInfo,
} from "@/lib/api-response";

type AssistenteBody = {
  pergunta?: string;
  contextoRota?: string;
  contextoEntidades?: {
    modulo?: string;
    casoId?: string;
    pedidoId?: string;
    minutaId?: string;
  };
  historico?: Array<{ role?: "user" | "assistant"; content?: string }>;
};

type ContextoAplicado = Record<string, string | null>;

function limitarTexto(valor: string, max = 2200): string {
  if (!valor) return "";
  const limpo = valor.trim().replace(/\s+/g, " ");
  return limpo.slice(0, max);
}

function serializarHistorico(
  historico: Array<{ role?: "user" | "assistant"; content?: string }> | undefined,
): string {
  if (!Array.isArray(historico) || historico.length === 0) return "Sem histórico anterior.";

  return historico
    .slice(-6)
    .map((item, index) => {
      const role = item.role === "assistant" ? "Assistente" : "Usuário";
      const content = limitarTexto(item.content ?? "", 500);
      return `${index + 1}. ${role}: ${content || "[vazio]"}`;
    })
    .join("\n");
}

function sanitizarId(valor: string | undefined): string | undefined {
  if (!valor) return undefined;
  const limpo = valor.trim();
  if (!limpo) return undefined;
  if (!/^[A-Za-z0-9:_-]{2,80}$/.test(limpo)) return undefined;
  return limpo;
}

async function construirResumoContexto(
  contextoEntidades: AssistenteBody["contextoEntidades"],
  contextoRota: string,
): Promise<{ texto: string; contextoAplicado: ContextoAplicado }> {
  const contextoAplicado: ContextoAplicado = {
    modulo: sanitizarId(contextoEntidades?.modulo) ?? null,
    casoId: sanitizarId(contextoEntidades?.casoId) ?? null,
    pedidoId: sanitizarId(contextoEntidades?.pedidoId) ?? null,
    minutaId: sanitizarId(contextoEntidades?.minutaId) ?? null,
  };

  const linhas: string[] = [];
  if (contextoRota) {
    linhas.push(`Rota atual: ${contextoRota}`);
  }

  let minuta = contextoAplicado.minutaId
    ? await services.peticoesRepository.obterMinutaPorId(contextoAplicado.minutaId)
    : undefined;

  if (!contextoAplicado.pedidoId && minuta?.pedidoId) {
    contextoAplicado.pedidoId = minuta.pedidoId;
  }

  const pedido = contextoAplicado.pedidoId
    ? await services.peticoesRepository.obterPedidoPorId(contextoAplicado.pedidoId)
    : undefined;

  if (!minuta && pedido?.id) {
    minuta = await services.peticoesRepository.obterMinutaPorPedidoId(pedido.id);
    if (minuta?.id) {
      contextoAplicado.minutaId = minuta.id;
    }
  }

  if (!contextoAplicado.casoId && pedido?.casoId) {
    contextoAplicado.casoId = pedido.casoId;
  }

  const caso = contextoAplicado.casoId
    ? await services.casosRepository.obterCasoPorId(contextoAplicado.casoId)
    : undefined;

  if (pedido) {
    linhas.push(
      `Pedido ativo: ${pedido.id} | tipo: ${pedido.tipoPeca} | prioridade: ${pedido.prioridade} | etapa: ${pedido.etapaAtual} | prazo: ${pedido.prazoFinal}`,
    );
    if (pedido.intencaoProcessual) {
      linhas.push(`Intenção processual do pedido: ${pedido.intencaoProcessual}`);
    }
  }

  if (minuta) {
    linhas.push(
      `Minuta ativa: ${minuta.id} | título: ${minuta.titulo} | versões: ${minuta.versoes.length}`,
    );
  }

  if (caso) {
    const polo = detectarPoloRepresentado(caso);
    linhas.push(
      `Caso ativo: ${caso.id} | cliente: ${caso.cliente} | matéria: ${caso.materia} | tribunal: ${caso.tribunal} | status: ${caso.status} | polo representado: ${polo}`,
    );
    linhas.push(`Resumo do caso: ${limitarTexto(caso.resumo, 360)}`);
  }

  if (contextoAplicado.pedidoId) {
    try {
      const historico = await services.peticoesRepository.listarHistoricoPipeline(contextoAplicado.pedidoId);
      if (historico.length > 0) {
        const ultimos = historico.slice(-3).map((item) => `${item.etapa}: ${limitarTexto(item.descricao, 90)}`);
        linhas.push(`Pipeline recente: ${ultimos.join(" | ")}`);
      }
    } catch {
      // Não bloqueia resposta se falhar leitura do histórico
    }

    try {
      const contextoJuridico = await getPeticoesOperacionalInfra()
        .contextoJuridicoPedidoRepository
        .obterUltimaVersao(contextoAplicado.pedidoId);
      if (contextoJuridico?.estrategiaSugerida) {
        linhas.push(
          `Estratégia jurídica consolidada (v${contextoJuridico.versaoContexto}): ${limitarTexto(contextoJuridico.estrategiaSugerida, 300)}`,
        );
      }
    } catch {
      // Não bloqueia resposta se falhar leitura do contexto jurídico
    }

    try {
      const documentosPedido = await listarDocumentos({ pedidoId: contextoAplicado.pedidoId });
      if (documentosPedido.length > 0) {
        linhas.push(`Documentos vinculados ao pedido: ${documentosPedido.length}`);
      }
    } catch {
      // Não bloqueia resposta se falhar leitura dos documentos do pedido
    }
  }

  if (contextoAplicado.casoId) {
    try {
      const documentosCaso = await listarDocumentos({ casoId: contextoAplicado.casoId });
      if (documentosCaso.length > 0) {
        linhas.push(`Documentos vinculados ao caso: ${documentosCaso.length}`);
      }
    } catch {
      // Não bloqueia resposta se falhar leitura dos documentos do caso
    }
  }

  if (linhas.length === 0) {
    linhas.push("Sem entidade operacional ativa (caso/pedido/minuta) na rota atual.");
  }

  return {
    texto: linhas.join("\n"),
    contextoAplicado,
  };
}

function extrairRespostaUtil(texto: string | undefined): string {
  if (!texto) return "";
  const limpo = texto.trim();
  if (!limpo) return "";
  if (limpo === "{}" || limpo === "[]") return "";
  return limpo;
}

function descreverEscopoContexto(contextoAplicado: ContextoAplicado): string {
  if (contextoAplicado.minutaId) return `minuta ${contextoAplicado.minutaId}`;
  if (contextoAplicado.pedidoId) return `pedido ${contextoAplicado.pedidoId}`;
  if (contextoAplicado.casoId) return `caso ${contextoAplicado.casoId}`;
  if (contextoAplicado.modulo) return `módulo ${contextoAplicado.modulo}`;
  return "contexto geral do hub";
}

function montarRespostaFallback(pergunta: string, contextoAplicado: ContextoAplicado): string {
  const escopo = descreverEscopoContexto(contextoAplicado);
  return `Entendimento:
Sua pergunta foi recebida e vinculada ao ${escopo}, mas o modelo não retornou conteúdo textual utilizável nesta tentativa.

Fundamentação inicial:
Sem resposta gerada pelo LLM, não é seguro inferir tese fechada. Para preservar qualidade técnica, recomendo consolidar fatos, objetivo processual e restrições do caso antes da conclusão jurídica final.

Próximos passos:
1. Reenvie a pergunta com objetivo processual explícito (ex.: contestar, impugnar, recorrer, pedir tutela).
2. Inclua 3 fatos-chave, prazo processual e pedido principal.
3. Se houver, cite documentos relevantes e o risco jurídico imediato.
4. Após isso, o assistente pode devolver minuta de estratégia mais assertiva.

Pergunta original:
${limitarTexto(pergunta, 600)}`;
}

export async function POST(request: Request) {
  const requestId = getRequestId(request);

  const unauth = await requireAuth();
  if (unauth) return unauth;
  const session = (await auth())!;

  const rl = verificarRateLimit(session.user.id, "assistente-juridico", 40);
  if (!rl.permitido) {
    const resetMin = Math.ceil(rl.resetEmMs / 60000);
    return jsonWithRequestId(
      requestId,
      { error: `Limite de consultas do assistente atingido. Tente novamente em ${resetMin} minuto(s).` },
      { status: 429, headers: { "Retry-After": String(Math.ceil(rl.resetEmMs / 1000)) } },
    );
  }

  try {
    const body = (await request.json()) as AssistenteBody;
    const pergunta = limitarTexto(body.pergunta ?? "", 3000);
    const contextoRota = limitarTexto(body.contextoRota ?? "", 200);
    const historico = serializarHistorico(body.historico);

    if (!pergunta) {
      return jsonError(requestId, "Pergunta obrigatória.", 400);
    }

    logApiInfo("api/agents/assistente-juridico", requestId, "consulta recebida", {
      usuarioId: session.user.id,
      contextoRota,
    });

    const { texto: resumoContexto, contextoAplicado } = await construirResumoContexto(
      body.contextoEntidades,
      contextoRota,
    );

    await syncRuntimeAIConfig();
    if (!isAIAvailable()) {
      return jsonWithRequestId(requestId, {
        resposta:
          "IA não configurada no ambiente. Acesse Administração > Configurações, configure provedor/API key e teste a conexão para habilitar respostas jurídicas automáticas.",
        modo: "mock",
        contextoAplicado,
      });
    }

    const systemCompleto = `Você é um assistente jurídico brasileiro de apoio operacional interno para escritório de advocacia.
Responda em português-BR, de forma objetiva e tecnicamente correta.
Diretrizes obrigatórias:
- Estruture em blocos curtos: "Entendimento", "Fundamentação", "Próximos passos".
- Quando houver incerteza fática, explicite premissas e indique o que falta validar.
- Não invente jurisprudência, número de processo ou dispositivo legal.
- Não ofereça promessa de resultado judicial.
- Trate a resposta como apoio técnico; decisão final sempre humana.
- Se a pergunta for ampla, devolva estratégia prática e checklist.
- Quando houver contexto operacional (caso/pedido/minuta), priorize esse contexto e mencione IDs quando isso ajudar a rastreabilidade.`;

    const promptCompleto = `Contexto da tela atual: ${contextoRota || "não informado"}

Contexto operacional validado:
${resumoContexto}

Histórico resumido:
${historico}

Pergunta do usuário:
${pergunta}

Forneça resposta jurídica prática e aplicável ao contexto de operação de um escritório.`;

    const promptEnxuto = `Pergunta jurídica:
${pergunta}

Contexto operacional:
${resumoContexto}

Responda obrigatoriamente em português-BR com os blocos:
Entendimento, Fundamentação, Próximos passos.`;

    let respostaFinal = "";
    let modoResposta: "ai" | "ai_retry" | "ai_fallback_local" = "ai";
    let aviso: string | undefined;

    try {
      const primeira = await generateText({
        model: getLLM(),
        maxOutputTokens: 900,
        temperature: 0.2,
        system: systemCompleto,
        prompt: promptCompleto,
      });
      respostaFinal = extrairRespostaUtil(primeira.text);
    } catch (error) {
      logApiInfo("api/agents/assistente-juridico", requestId, "primeira_tentativa_falhou", {
        erro: error instanceof Error ? error.message.slice(0, 200) : String(error),
      });
    }

    if (!respostaFinal) {
      try {
        const segunda = await generateText({
          model: getLLM(),
          maxOutputTokens: 700,
          temperature: 0.1,
          system:
            "Você é assistente jurídico operacional. Responda obrigatoriamente com texto objetivo em português-BR.",
          prompt: promptEnxuto,
        });
        respostaFinal = extrairRespostaUtil(segunda.text);
        if (respostaFinal) {
          modoResposta = "ai_retry";
        }
      } catch (error) {
        logApiInfo("api/agents/assistente-juridico", requestId, "segunda_tentativa_falhou", {
          erro: error instanceof Error ? error.message.slice(0, 200) : String(error),
        });
      }
    }

    if (!respostaFinal) {
      modoResposta = "ai_fallback_local";
      aviso =
        "Resposta gerada em fallback local porque o provedor não retornou conteúdo textual utilizável nesta chamada.";
      respostaFinal = montarRespostaFallback(pergunta, contextoAplicado);
      logApiInfo("api/agents/assistente-juridico", requestId, "fallback_local_aplicado", {
        contexto: descreverEscopoContexto(contextoAplicado),
      });
    }

    return jsonWithRequestId(requestId, {
      resposta: respostaFinal,
      modo: modoResposta,
      contextoAplicado,
      aviso,
    });
  } catch (error) {
    logApiError("api/agents/assistente-juridico", requestId, error);
    return jsonError(
      requestId,
      error instanceof Error ? error.message : "Erro interno no assistente jurídico.",
      500,
    );
  }
}
