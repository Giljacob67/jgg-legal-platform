import { generateText } from "ai";
import { requireAuth } from "@/lib/api-auth";
import { auth } from "@/lib/auth";
import { getLLM, isAIAvailable } from "@/lib/ai/provider";
import { syncRuntimeAIConfig } from "@/lib/ai/runtime-config";
import { verificarRateLimit } from "@/lib/rate-limit";
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
  historico?: Array<{ role?: "user" | "assistant"; content?: string }>;
};

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

    await syncRuntimeAIConfig();
    if (!isAIAvailable()) {
      return jsonWithRequestId(requestId, {
        resposta:
          "IA não configurada no ambiente. Acesse Administração > Configurações, configure provedor/API key e teste a conexão para habilitar respostas jurídicas automáticas.",
        modo: "mock",
      });
    }

    const { text } = await generateText({
      model: getLLM(),
      maxOutputTokens: 900,
      temperature: 0.2,
      system: `Você é um assistente jurídico brasileiro de apoio operacional interno para escritório de advocacia.
Responda em português-BR, de forma objetiva e tecnicamente correta.
Diretrizes obrigatórias:
- Estruture em blocos curtos: "Entendimento", "Fundamentação", "Próximos passos".
- Quando houver incerteza fática, explicite premissas e indique o que falta validar.
- Não invente jurisprudência, número de processo ou dispositivo legal.
- Não ofereça promessa de resultado judicial.
- Trate a resposta como apoio técnico; decisão final sempre humana.
- Se a pergunta for ampla, devolva estratégia prática e checklist.`,
      prompt: `Contexto da tela atual: ${contextoRota || "não informado"}

Histórico resumido:
${historico}

Pergunta do usuário:
${pergunta}

Forneça resposta jurídica prática e aplicável ao contexto de operação de um escritório.`,
    });

    return jsonWithRequestId(requestId, {
      resposta:
        text.trim() ||
        "Não consegui gerar uma resposta útil com os dados atuais. Reformule a pergunta com mais fatos e objetivo processual.",
      modo: "ai",
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
