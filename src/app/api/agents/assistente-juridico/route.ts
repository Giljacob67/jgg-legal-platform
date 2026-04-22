import { generateText } from "ai";
import { requireAuth } from "@/lib/api-auth";
import { auth } from "@/lib/auth";
import { getLLM, getModeloId, getProvedor, isAIAvailable } from "@/lib/ai/provider";
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
const OLLAMA_FIRST_TOKEN_TIMEOUT_MS = 12_000;
const OLLAMA_TOTAL_TIMEOUT_MS = 45_000;
const OLLAMA_COMPAT_TOTAL_TIMEOUT_MS = 28_000;
const OLLAMA_MAX_TOKENS = 320;

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

function normalizarBaseOpenAICompat(rawBaseUrl: string): string {
  const base = rawBaseUrl.trim().replace(/\/+$/, "");
  if (!base) return "";
  if (base.endsWith("/v1")) return base;
  if (base.endsWith("/api")) return `${base.slice(0, -4)}/v1`;
  return `${base}/v1`;
}

function normalizarBaseNativaOllama(rawBaseUrl: string): string {
  const base = rawBaseUrl.trim().replace(/\/+$/, "");
  if (!base) return "";
  if (base.endsWith("/v1")) return `${base.slice(0, -3)}/api`;
  if (base.endsWith("/api")) return base;
  return `${base}/api`;
}

function priorizarOpenAICompatOllama(rawBaseUrl: string, modelId: string): boolean {
  const base = rawBaseUrl.trim().toLowerCase();
  const model = modelId.trim().toLowerCase();
  return base.includes("ollama.com") || base.endsWith("/v1") || model.endsWith(":cloud");
}

function extrairStatusDiagnostico(diagnostic: string): number | null {
  const match = diagnostic.match(/_http_(\d{3})/);
  return match ? Number(match[1]) : null;
}

function deveTentarFallbackOllama(diagnostic: string): boolean {
  const status = extrairStatusDiagnostico(diagnostic);
  return status === 404 || status === 405 || status === 501;
}

function extrairConteudoChatCompletion(payload: unknown): string {
  if (!payload || typeof payload !== "object") return "";
  const obj = payload as Record<string, unknown>;
  const choices = Array.isArray(obj.choices) ? obj.choices : [];
  const choice = choices[0] && typeof choices[0] === "object" ? (choices[0] as Record<string, unknown>) : null;
  const message =
    choice?.message && typeof choice.message === "object"
      ? (choice.message as Record<string, unknown>)
      : null;
  const content = typeof message?.content === "string" ? message.content.trim() : "";
  return content;
}

function programarAbort(controller: AbortController, timeoutMs: number): NodeJS.Timeout {
  return setTimeout(() => controller.abort(), timeoutMs);
}

async function lerTextoStreamOpenAICompat(
  response: Response,
  controller: AbortController,
): Promise<string> {
  if (!response.body) return "";
  const decoder = new TextDecoder();
  const reader = response.body.getReader();
  let buffer = "";
  let texto = "";
  let timer = programarAbort(controller, OLLAMA_FIRST_TOKEN_TIMEOUT_MS);
  let recebeuPrimeiroToken = false;

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const linhas = buffer.split("\n");
      buffer = linhas.pop() ?? "";

      for (const linhaBruta of linhas) {
        const linha = linhaBruta.trim();
        if (!linha.startsWith("data:")) continue;
        const payload = linha.slice(5).trim();
        if (!payload || payload === "[DONE]") continue;

        const json = JSON.parse(payload) as Record<string, unknown>;
        const choices = Array.isArray(json.choices) ? json.choices : [];
        const choice = choices[0] && typeof choices[0] === "object" ? (choices[0] as Record<string, unknown>) : null;
        const delta =
          choice?.delta && typeof choice.delta === "object"
            ? (choice.delta as Record<string, unknown>)
            : null;
        const content = typeof delta?.content === "string" ? delta.content : "";
        if (content) {
          texto += content;
          if (!recebeuPrimeiroToken) {
            recebeuPrimeiroToken = true;
            clearTimeout(timer);
            timer = programarAbort(controller, OLLAMA_TOTAL_TIMEOUT_MS);
          }
        }
      }
    }
  } finally {
    clearTimeout(timer);
    reader.releaseLock();
  }

  return texto.trim();
}

async function lerTextoStreamNdjson(
  response: Response,
  controller: AbortController,
  field: "response" | "message",
): Promise<string> {
  if (!response.body) return "";
  const decoder = new TextDecoder();
  const reader = response.body.getReader();
  let buffer = "";
  let texto = "";
  let timer = programarAbort(controller, OLLAMA_FIRST_TOKEN_TIMEOUT_MS);
  let recebeuPrimeiroToken = false;

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const linhas = buffer.split("\n");
      buffer = linhas.pop() ?? "";

      for (const linhaBruta of linhas) {
        const linha = linhaBruta.trim();
        if (!linha) continue;
        const json = JSON.parse(linha) as Record<string, unknown>;
        const token =
          field === "response"
            ? typeof json.response === "string"
              ? json.response
              : ""
            : json.message && typeof json.message === "object"
              ? typeof (json.message as Record<string, unknown>).content === "string"
                ? ((json.message as Record<string, unknown>).content as string)
                : ""
              : "";
        if (token) {
          texto += token;
          if (!recebeuPrimeiroToken) {
            recebeuPrimeiroToken = true;
            clearTimeout(timer);
            timer = programarAbort(controller, OLLAMA_TOTAL_TIMEOUT_MS);
          }
        }
      }
    }
  } finally {
    clearTimeout(timer);
    reader.releaseLock();
  }

  return texto.trim();
}

async function tentarGeracaoDiretaOllamaOpenAICompat(params: {
  modelId: string;
  system: string;
  prompt: string;
}): Promise<{ text: string; diagnostic: string }> {
  const rawBaseUrl = process.env.OLLAMA_BASE_URL ?? "http://localhost:11434";
  const baseUrl = normalizarBaseOpenAICompat(rawBaseUrl);
  if (!baseUrl) return { text: "", diagnostic: "base_url_openai_vazia" };
  const usarModoCloud = priorizarOpenAICompatOllama(rawBaseUrl, params.modelId);

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (process.env.OLLAMA_API_KEY) {
    headers.Authorization = `Bearer ${process.env.OLLAMA_API_KEY}`;
  }

  const controller = new AbortController();
  const timeout = programarAbort(
    controller,
    usarModoCloud ? OLLAMA_COMPAT_TOTAL_TIMEOUT_MS : OLLAMA_FIRST_TOKEN_TIMEOUT_MS,
  );
  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: params.modelId,
        stream: !usarModoCloud,
        messages: [
          { role: "system", content: params.system },
          { role: "user", content: params.prompt },
        ],
        temperature: 0.1,
        max_tokens: usarModoCloud ? 220 : OLLAMA_MAX_TOKENS,
        reasoning_effort: "low",
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const bodyText = await response.text().catch(() => "");
      return {
        text: "",
        diagnostic: `openai_compat_http_${response.status}:${limitarTexto(bodyText, 180)}`,
      };
    }

    if (usarModoCloud) {
      const payload = await response.json().catch(() => null);
      return {
        text: extrairConteudoChatCompletion(payload),
        diagnostic: "openai_compat_ok",
      };
    }

    return {
      text: await lerTextoStreamOpenAICompat(response, controller),
      diagnostic: "openai_compat_ok",
    };
  } catch (error) {
    const msg = error instanceof Error ? `${error.name}:${error.message}` : String(error);
    return { text: "", diagnostic: `openai_compat_exception:${limitarTexto(msg, 180)}` };
  } finally {
    clearTimeout(timeout);
  }
}

async function tentarGeracaoDiretaOllamaNativo(params: {
  modelId: string;
  system: string;
  prompt: string;
}): Promise<{ text: string; diagnostic: string }> {
  const baseUrl = normalizarBaseNativaOllama(process.env.OLLAMA_BASE_URL ?? "http://localhost:11434");
  if (!baseUrl) return { text: "", diagnostic: "base_url_nativa_vazia" };

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (process.env.OLLAMA_API_KEY) {
    headers.Authorization = `Bearer ${process.env.OLLAMA_API_KEY}`;
  }

  const controller = new AbortController();
  const timeout = programarAbort(controller, OLLAMA_FIRST_TOKEN_TIMEOUT_MS);
  try {
    const response = await fetch(`${baseUrl}/chat`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: params.modelId,
        stream: true,
        messages: [
          { role: "system", content: params.system },
          { role: "user", content: params.prompt },
        ],
        options: {
          temperature: 0.1,
          num_predict: OLLAMA_MAX_TOKENS,
        },
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const bodyText = await response.text().catch(() => "");
      return {
        text: "",
        diagnostic: `ollama_nativo_http_${response.status}:${limitarTexto(bodyText, 180)}`,
      };
    }

    const responseText = await lerTextoStreamNdjson(response, controller, "message");
    return {
      text: responseText,
      diagnostic: responseText ? "ollama_nativo_ok" : "ollama_nativo_sem_texto",
    };
  } catch (error) {
    const msg = error instanceof Error ? `${error.name}:${error.message}` : String(error);
    return { text: "", diagnostic: `ollama_nativo_exception:${limitarTexto(msg, 180)}` };
  } finally {
    clearTimeout(timeout);
  }
}

async function tentarGeracaoDiretaOllamaGenerate(params: {
  modelId: string;
  system: string;
  prompt: string;
}): Promise<{ text: string; diagnostic: string }> {
  const baseUrl = normalizarBaseNativaOllama(process.env.OLLAMA_BASE_URL ?? "http://localhost:11434");
  if (!baseUrl) return { text: "", diagnostic: "base_url_generate_vazia" };

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (process.env.OLLAMA_API_KEY) {
    headers.Authorization = `Bearer ${process.env.OLLAMA_API_KEY}`;
  }

  const controller = new AbortController();
  const timeout = programarAbort(controller, OLLAMA_FIRST_TOKEN_TIMEOUT_MS);
  try {
    const response = await fetch(`${baseUrl}/generate`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: params.modelId,
        stream: true,
        prompt: `${params.system}\n\n${params.prompt}`,
        options: {
          temperature: 0.1,
          num_predict: OLLAMA_MAX_TOKENS,
        },
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const bodyText = await response.text().catch(() => "");
      return {
        text: "",
        diagnostic: `ollama_generate_http_${response.status}:${limitarTexto(bodyText, 180)}`,
      };
    }

    const responseText = await lerTextoStreamNdjson(response, controller, "response");
    if (responseText) {
      return { text: responseText, diagnostic: "ollama_generate_ok" };
    }

    return { text: "", diagnostic: "ollama_generate_sem_texto" };
  } catch (error) {
    const msg = error instanceof Error ? `${error.name}:${error.message}` : String(error);
    return { text: "", diagnostic: `ollama_generate_exception:${limitarTexto(msg, 180)}` };
  } finally {
    clearTimeout(timeout);
  }
}

async function tentarGeracaoOllamaRapida(params: {
  modelId: string;
  system: string;
  prompt: string;
}): Promise<{
  text: string;
  modo: "ai_retry_compat" | "ai_retry_native" | "ai_retry_generate";
  diagnostic: string;
}> {
  const baseUrl = process.env.OLLAMA_BASE_URL ?? "http://localhost:11434";
  const preferirCompat = priorizarOpenAICompatOllama(baseUrl, params.modelId);
  const tentativas = preferirCompat
    ? [
        {
          modo: "ai_retry_compat" as const,
          executar: () => tentarGeracaoDiretaOllamaOpenAICompat(params),
        },
        {
          modo: "ai_retry_native" as const,
          executar: () => tentarGeracaoDiretaOllamaNativo(params),
        },
        {
          modo: "ai_retry_generate" as const,
          executar: () => tentarGeracaoDiretaOllamaGenerate(params),
        },
      ]
    : [
        {
          modo: "ai_retry_native" as const,
          executar: () => tentarGeracaoDiretaOllamaNativo(params),
        },
        {
          modo: "ai_retry_generate" as const,
          executar: () => tentarGeracaoDiretaOllamaGenerate(params),
        },
        {
          modo: "ai_retry_compat" as const,
          executar: () => tentarGeracaoDiretaOllamaOpenAICompat(params),
        },
      ];

  const diagnosticos: string[] = [];
  for (const tentativa of tentativas) {
    const resultado = await tentativa.executar();
    if (extrairRespostaUtil(resultado.text)) {
      return {
        text: extrairRespostaUtil(resultado.text),
        modo: tentativa.modo,
        diagnostic: resultado.diagnostic,
      };
    }

    diagnosticos.push(resultado.diagnostic);
    if (!deveTentarFallbackOllama(resultado.diagnostic)) {
      break;
    }
  }

  return {
    text: "",
    modo: tentativas[0]?.modo ?? "ai_retry_native",
    diagnostic: diagnosticos.join(" | "),
  };
}

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  let perguntaParaFallback = "";
  let contextoAplicadoFallback: ContextoAplicado = {
    modulo: null,
    casoId: null,
    pedidoId: null,
    minutaId: null,
  };

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
    perguntaParaFallback = pergunta;
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
    contextoAplicadoFallback = contextoAplicado;

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

    const promptOllama = contextoAplicado.casoId || contextoAplicado.pedidoId || contextoAplicado.minutaId
      ? promptEnxuto
      : `Pergunta jurídica:
${pergunta}

Responda em português-BR, com objetividade, usando os blocos:
Entendimento, Fundamentação, Próximos passos.
Se citar requisitos, organize em itens curtos.`;

    const provedorAtivo = getProvedor();
    const usarFluxoRapidoOllama = provedorAtivo === "ollama";
    let respostaFinal = "";
    let modoResposta:
      | "ai"
      | "ai_retry"
      | "ai_retry_compat"
      | "ai_retry_native"
      | "ai_retry_generate"
      | "ai_fallback_local" = "ai";
    let aviso: string | undefined;
    let diagnosticoFalha = "";

    if (!usarFluxoRapidoOllama) {
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
    }

    if (!respostaFinal && !usarFluxoRapidoOllama) {
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

    if (!respostaFinal && usarFluxoRapidoOllama) {
      const ollamaResult = await tentarGeracaoOllamaRapida({
        modelId: getModeloId(),
        system:
          "Você é assistente jurídico operacional. Responda em português-BR com Entendimento, Fundamentação e Próximos passos.",
        prompt: promptOllama,
      });
      if (ollamaResult.text) {
        respostaFinal = ollamaResult.text;
        modoResposta = ollamaResult.modo;
        logApiInfo("api/agents/assistente-juridico", requestId, "ollama_resposta_rapida", {
          modo: ollamaResult.modo,
          diagnostico: ollamaResult.diagnostic,
        });
      } else {
        diagnosticoFalha = ollamaResult.diagnostic;
        logApiInfo("api/agents/assistente-juridico", requestId, "fallback_ollama_sem_texto", {
          diagnostico: diagnosticoFalha,
        });
      }
    }

    if (!respostaFinal) {
      modoResposta = "ai_fallback_local";
      aviso =
        "Resposta gerada em fallback local porque o provedor não retornou conteúdo textual utilizável nesta chamada.";
      if (diagnosticoFalha) {
        aviso += ` Diagnóstico técnico: ${diagnosticoFalha}.`;
      }
      respostaFinal = montarRespostaFallback(pergunta, contextoAplicado);
      logApiInfo("api/agents/assistente-juridico", requestId, "fallback_local_aplicado", {
        contexto: descreverEscopoContexto(contextoAplicado),
        diagnosticoFalha,
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
    const msgErro = error instanceof Error ? error.message : "Erro interno no assistente jurídico.";
    return jsonWithRequestId(requestId, {
      resposta: montarRespostaFallback(
        perguntaParaFallback || "Pergunta não informada.",
        contextoAplicadoFallback,
      ),
      modo: "erro_fallback_local",
      contextoAplicado: contextoAplicadoFallback,
      aviso: `Assistente respondeu em fallback local devido a falha interna: ${limitarTexto(msgErro, 180)}.`,
    });
  }
}
