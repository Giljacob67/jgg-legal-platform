import { NextResponse } from "next/server";
import { requireRBAC } from "@/lib/api-auth";
import type { ProvedorIA } from "@/lib/ai/provider";

type TestConnectionBody = {
  provider?: ProvedorIA;
  modelId?: string;
  credentials?: Record<string, string | undefined>;
};

const ENV_BY_CONFIG_KEY: Record<string, string> = {
  ai_openai_api_key: "OPENAI_API_KEY",
  ai_openrouter_api_key: "OPENROUTER_API_KEY",
  ai_kilocode_api_key: "KILO_API_KEY",
  ai_anthropic_api_key: "ANTHROPIC_API_KEY",
  ai_google_api_key: "GOOGLE_GENERATIVE_AI_API_KEY",
  ai_groq_api_key: "GROQ_API_KEY",
  ai_xai_api_key: "XAI_API_KEY",
  ai_mistral_api_key: "MISTRAL_API_KEY",
  ai_ollama_base_url: "OLLAMA_BASE_URL",
  ai_ollama_api_key: "OLLAMA_API_KEY",
  ai_custom_base_url: "CUSTOM_BASE_URL",
  ai_custom_api_key: "CUSTOM_API_KEY",
};

function getConfigValue(
  credentials: Record<string, string | undefined> | undefined,
  configKey: keyof typeof ENV_BY_CONFIG_KEY,
): string {
  const fromBody = credentials?.[configKey];
  if (typeof fromBody === "string") return fromBody.trim();
  const env = ENV_BY_CONFIG_KEY[configKey];
  return (process.env[env] ?? "").trim();
}

function parseModelCount(payload: unknown): number | null {
  if (!payload || typeof payload !== "object") return null;
  const obj = payload as Record<string, unknown>;
  if (Array.isArray(obj.data)) return obj.data.length;
  if (Array.isArray(obj.models)) return obj.models.length;
  if (Array.isArray(obj.items)) return obj.items.length;
  return null;
}

function normalizeBaseUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `http://${trimmed}`;
  return withProtocol.replace(/\/+$/, "");
}

function friendlyProviderName(provider: ProvedorIA): string {
  const label: Record<ProvedorIA, string> = {
    openai: "OpenAI",
    openrouter: "OpenRouter",
    kilocode: "KiloCode",
    anthropic: "Anthropic",
    google: "Google AI",
    groq: "Groq",
    xai: "xAI",
    mistral: "Mistral AI",
    ollama: "Ollama",
    custom: "Endpoint custom",
  };
  return label[provider];
}

function buildFriendlyError(provider: ProvedorIA, status: number, details?: string): string {
  const nome = friendlyProviderName(provider);
  if (status === 401 || status === 403) {
    return `${nome}: credencial inválida ou sem permissão. Revise a API key/token.`;
  }
  if (status === 404) {
    if (provider === "ollama") {
      return "Ollama: endpoint não encontrado. Use URL base nativa (ex.: http://localhost:11434) ou endpoint OpenAI-compatible terminando em /v1.";
    }
    return `${nome}: endpoint não encontrado. Verifique a Base URL e o sufixo /v1 quando aplicável.`;
  }
  if (status === 429) {
    return `${nome}: limite de uso atingido. Aguarde ou revise o plano da conta.`;
  }
  if (status >= 500) {
    return `${nome}: serviço indisponível no momento. Tente novamente em instantes.`;
  }
  if (details) {
    return `${nome}: falha na validação (${details.slice(0, 180)}).`;
  }
  return `${nome}: não foi possível validar a conexão.`;
}

function buildOllamaV1ModelsUrl(baseUrl: string): string {
  const normalized = baseUrl.replace(/\/+$/, "");
  if (normalized.endsWith("/v1")) return `${normalized}/models`;
  return `${normalized}/v1/models`;
}

async function safeJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs = 10_000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export async function POST(request: Request) {
  const forbidden = await requireRBAC("administracao", "leitura");
  if (forbidden) return forbidden;

  const body = (await request.json()) as TestConnectionBody;
  const provider = body.provider;
  const credentials = body.credentials;

  if (!provider) {
    return NextResponse.json({ error: "Provedor não informado para teste." }, { status: 400 });
  }

  try {
    let response: Response | null = null;
    let connectionMode: "native" | "openai-compatible" | null = null;

    switch (provider) {
      case "openai": {
        const apiKey = getConfigValue(credentials, "ai_openai_api_key");
        if (!apiKey) {
          return NextResponse.json({ error: "Informe a API Key OpenAI para testar." }, { status: 400 });
        }
        response = await fetchWithTimeout("https://api.openai.com/v1/models", {
          headers: { Authorization: `Bearer ${apiKey}` },
        });
        break;
      }
      case "anthropic": {
        const apiKey = getConfigValue(credentials, "ai_anthropic_api_key");
        if (!apiKey) {
          return NextResponse.json({ error: "Informe a API Key Anthropic para testar." }, { status: 400 });
        }
        response = await fetchWithTimeout("https://api.anthropic.com/v1/models", {
          headers: {
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
          },
        });
        break;
      }
      case "google": {
        const apiKey = getConfigValue(credentials, "ai_google_api_key");
        if (!apiKey) {
          return NextResponse.json({ error: "Informe a API Key Google AI para testar." }, { status: 400 });
        }
        response = await fetchWithTimeout(
          `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`,
          {},
        );
        break;
      }
      case "groq": {
        const apiKey = getConfigValue(credentials, "ai_groq_api_key");
        if (!apiKey) {
          return NextResponse.json({ error: "Informe a API Key Groq para testar." }, { status: 400 });
        }
        response = await fetchWithTimeout("https://api.groq.com/openai/v1/models", {
          headers: { Authorization: `Bearer ${apiKey}` },
        });
        break;
      }
      case "xai": {
        const apiKey = getConfigValue(credentials, "ai_xai_api_key");
        if (!apiKey) {
          return NextResponse.json({ error: "Informe a API Key xAI para testar." }, { status: 400 });
        }
        response = await fetchWithTimeout("https://api.x.ai/v1/models", {
          headers: { Authorization: `Bearer ${apiKey}` },
        });
        break;
      }
      case "mistral": {
        const apiKey = getConfigValue(credentials, "ai_mistral_api_key");
        if (!apiKey) {
          return NextResponse.json({ error: "Informe a API Key Mistral para testar." }, { status: 400 });
        }
        response = await fetchWithTimeout("https://api.mistral.ai/v1/models", {
          headers: { Authorization: `Bearer ${apiKey}` },
        });
        break;
      }
      case "openrouter": {
        const apiKey = getConfigValue(credentials, "ai_openrouter_api_key");
        if (!apiKey) {
          return NextResponse.json({ error: "Informe a API Key OpenRouter para testar." }, { status: 400 });
        }
        response = await fetchWithTimeout("https://openrouter.ai/api/v1/models", {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "HTTP-Referer": "https://jgg.adv.br",
            "X-Title": "JGG Legal Platform",
          },
        });
        break;
      }
      case "kilocode": {
        const apiKey = getConfigValue(credentials, "ai_kilocode_api_key");
        if (!apiKey) {
          return NextResponse.json({ error: "Informe a API Key KiloCode para testar." }, { status: 400 });
        }
        response = await fetchWithTimeout("https://api.kilo.ai/api/gateway/models", {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "HTTP-Referer": "https://jgg.adv.br",
            "X-Title": "JGG Legal Platform",
          },
        });
        break;
      }
      case "ollama": {
        const baseUrlRaw = getConfigValue(credentials, "ai_ollama_base_url") || "http://localhost:11434";
        const baseUrl = normalizeBaseUrl(baseUrlRaw);
        if (!baseUrl) {
          return NextResponse.json({ error: "Informe a Base URL do Ollama para testar." }, { status: 400 });
        }
        const apiKey = getConfigValue(credentials, "ai_ollama_api_key");
        response = await fetchWithTimeout(`${baseUrl}/api/tags`, {
          headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : undefined,
        });
        if (!response.ok && response.status === 404) {
          response = await fetchWithTimeout(buildOllamaV1ModelsUrl(baseUrl), {
            headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : undefined,
          });
          if (response.ok) {
            connectionMode = "openai-compatible";
          }
        } else if (response.ok) {
          connectionMode = "native";
        }
        break;
      }
      case "custom": {
        const baseUrlRaw = getConfigValue(credentials, "ai_custom_base_url");
        const baseUrl = normalizeBaseUrl(baseUrlRaw);
        if (!baseUrl) {
          return NextResponse.json({ error: "Informe a Base URL do endpoint custom para testar." }, { status: 400 });
        }
        const apiKey = getConfigValue(credentials, "ai_custom_api_key");
        response = await fetchWithTimeout(`${baseUrl}/models`, {
          headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : undefined,
        });
        break;
      }
    }

    if (!response) {
      return NextResponse.json({ error: "Não foi possível iniciar o teste de conexão." }, { status: 500 });
    }

    const payload = await safeJson(response);

    if (!response.ok) {
      const detailText =
        typeof payload === "object" && payload !== null
          ? JSON.stringify(payload).slice(0, 300)
          : undefined;
      return NextResponse.json(
        {
          error: buildFriendlyError(provider, response.status, detailText),
          status: response.status,
          details: detailText,
        },
        { status: 502 },
      );
    }

    const modelCount = parseModelCount(payload);
    const ollamaModeTexto =
      provider === "ollama" && connectionMode === "openai-compatible"
        ? " via endpoint OpenAI-compatible (/v1)"
        : provider === "ollama" && connectionMode === "native"
          ? " via endpoint nativo (/api)"
          : "";
    return NextResponse.json({
      ok: true,
      provider,
      message:
        modelCount !== null
          ? `Conexão com ${friendlyProviderName(provider)} validada${ollamaModeTexto} (${modelCount} modelos retornados).`
          : `Conexão com ${friendlyProviderName(provider)} validada com sucesso${ollamaModeTexto}.`,
      modelCount,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro desconhecido";
    if (msg.toLowerCase().includes("aborted")) {
      return NextResponse.json(
        { error: "Tempo de resposta excedido. Verifique endpoint, rede ou firewall." },
        { status: 504 },
      );
    }
    if (
      msg.includes("ECONNREFUSED") ||
      msg.includes("ENOTFOUND") ||
      msg.includes("EHOSTUNREACH") ||
      msg.includes("fetch failed")
    ) {
      return NextResponse.json(
        { error: "Não foi possível alcançar o provedor. Revise URL, rede e regras de acesso." },
        { status: 502 },
      );
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
