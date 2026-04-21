"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ConfiguracaoSistema } from "../domain/types";
import type { ModeloCatalogo, ProvedorIA } from "@/lib/ai/provider";
import { InlineAlert } from "@/components/ui/inline-alert";
import { MoonIcon, SettingsIcon, SunIcon } from "@/components/ui/icons";
import { TextInput } from "@/components/ui/text-input";

type ConfiguracoesIAProps = {
  configuracoes: ConfiguracaoSistema[];
  modelosDisponiveis?: ModeloCatalogo[];
};

const LABEL_CONFIG: Record<string, string> = {
  ai_provider: "Provedor de IA",
  ai_model: "Modelo de IA",
  prazo_alerta_dias: "Alertas de prazo (dias de antecedência)",
  nome_escritorio: "Nome do escritório",
  tema: "Tema da interface",
};

const DESCRICAO_CONFIG: Record<string, string> = {
  ai_provider: "Define qual gateway de IA será utilizado pelos agentes da plataforma.",
  ai_model:
    "Modelo de linguagem padrão. Use um ID manual ou selecione entre os modelos detectados automaticamente.",
  prazo_alerta_dias: "Quantos dias antes do vencimento o sistema emite um alerta.",
  nome_escritorio: "Nome exibido no cabeçalho da plataforma.",
  tema: "Escolha entre claro, escuro ou seguir configuração do sistema.",
};

type GrupoProvedor = {
  label: string;
  provedores: ProvedorIA[];
  envVar: string;
  obs?: string;
};

const GRUPOS_PROVEDORES: GrupoProvedor[] = [
  {
    label: "APIs comerciais",
    provedores: ["openai", "anthropic", "google", "groq", "xai", "mistral"],
    envVar: "OPENAI_API_KEY / ANTHROPIC_API_KEY / ...",
  },
  {
    label: "Gateways multi-modelo",
    provedores: ["openrouter", "kilocode"],
    envVar: "OPENROUTER_API_KEY / KILO_API_KEY",
    obs: "Acesso a centenas de modelos com uma única chave.",
  },
  {
    label: "Local (sem custo de API)",
    provedores: ["ollama"],
    envVar: "OLLAMA_BASE_URL · OLLAMA_API_KEY (opcional, para Ollama Pro ou instâncias remotas)",
    obs: "Local: sem custo, nenhum dado sai da máquina. Remoto/Pro: configure OLLAMA_BASE_URL + OLLAMA_API_KEY.",
  },
  {
    label: "Endpoint customizado (OpenAI-compatible)",
    provedores: ["custom"],
    envVar: "CUSTOM_BASE_URL · CUSTOM_API_KEY (opcional)",
    obs: "LM Studio, LocalAI, vLLM, Jan, Perplexity, Together AI ou qualquer serviço com API OpenAI-compatível.",
  },
];

const LABEL_PROVEDOR: Record<ProvedorIA, string> = {
  openai: "OpenAI",
  anthropic: "Anthropic",
  google: "Google AI",
  groq: "Groq",
  xai: "xAI",
  mistral: "Mistral AI",
  openrouter: "OpenRouter",
  kilocode: "KiloCode",
  ollama: "Ollama",
  custom: "Custom",
};

const TONALIDADE_PROVEDOR: Record<ProvedorIA, string> = {
  openai: "border-emerald-400 bg-emerald-50 text-emerald-900",
  anthropic: "border-orange-400 bg-orange-50 text-orange-900",
  google: "border-blue-400 bg-blue-50 text-blue-900",
  groq: "border-purple-400 bg-purple-50 text-purple-900",
  xai: "border-slate-400 bg-slate-50 text-slate-900",
  mistral: "border-sky-400 bg-sky-50 text-sky-900",
  openrouter: "border-violet-400 bg-violet-50 text-violet-900",
  kilocode: "border-indigo-400 bg-indigo-50 text-indigo-900",
  ollama: "border-lime-500 bg-lime-50 text-lime-900",
  custom: "border-amber-400 bg-amber-50 text-amber-900",
};

type FeedbackConfig = {
  tipo: "success" | "error";
  mensagem: string;
};

type ModeloAPI = {
  id: string;
  label: string;
  provedor: ProvedorIA;
  provedorLabel: string;
  descricao?: string;
  custo?: ModeloCatalogo["custo"];
  gratuito?: boolean;
  suportaVisao?: boolean;
};

const STATUS_CUSTO: Record<ModeloCatalogo["custo"], string> = {
  gratuito: "Gratuito",
  local: "Local",
  baixo: "Baixo custo",
  medio: "Custo médio",
  alto: "Alto custo",
  desconhecido: "Custo indefinido",
};

function custoOrdenacao(custo: ModeloCatalogo["custo"]) {
  const ordem: Record<ModeloCatalogo["custo"], number> = {
    gratuito: 0,
    local: 1,
    baixo: 2,
    medio: 3,
    alto: 4,
    desconhecido: 5,
  };
  return ordem[custo];
}

function aplicarTema(valor: "claro" | "escuro" | "sistema") {
  if (valor === "escuro") {
    document.documentElement.classList.add("dark");
    localStorage.setItem("jgg-theme", "dark");
    return;
  }
  if (valor === "claro") {
    document.documentElement.classList.remove("dark");
    localStorage.setItem("jgg-theme", "light");
    return;
  }
  localStorage.removeItem("jgg-theme");
  if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
}

function normalizarModeloDinamico(item: ModeloAPI): ModeloCatalogo {
  return {
    id: item.id,
    label: item.label ?? item.id,
    provedor: item.provedor,
    provedorLabel: item.provedorLabel ?? LABEL_PROVEDOR[item.provedor],
    descricao: item.descricao ?? "Modelo detectado dinamicamente no provedor configurado.",
    suportaVisao: Boolean(item.suportaVisao),
    suportaStructuredOutput: true,
    custo: item.custo ?? (item.gratuito ? "gratuito" : "desconhecido"),
    recomendado: item.id === "kimi-k2.6:cloud",
  };
}

export function ConfiguracoesIA({
  configuracoes,
  modelosDisponiveis = [],
}: ConfiguracoesIAProps) {
  const [valores, setValores] = useState<Record<string, string>>(
    Object.fromEntries(configuracoes.map((c) => [c.chave, c.valor]))
  );
  const [salvando, setSalvando] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Record<string, FeedbackConfig>>({});
  const [modelosDinamicos, setModelosDinamicos] = useState<ModeloCatalogo[]>([]);
  const [carregandoModelos, setCarregandoModelos] = useState(false);
  const [erroModelos, setErroModelos] = useState<string | null>(null);

  const carregarModelosDinamicos = useCallback(async () => {
    setCarregandoModelos(true);
    setErroModelos(null);
    try {
      const res = await fetch("/api/ai/models", { cache: "no-store" });
      const payload = (await res.json()) as { modelos?: ModeloAPI[]; error?: string };
      if (!res.ok) {
        throw new Error(payload.error || "Não foi possível carregar modelos dinâmicos.");
      }
      setModelosDinamicos((payload.modelos ?? []).map(normalizarModeloDinamico));
    } catch (error) {
      setErroModelos(error instanceof Error ? error.message : "Falha ao consultar modelos dinâmicos.");
    } finally {
      setCarregandoModelos(false);
    }
  }, []);

  useEffect(() => {
    void carregarModelosDinamicos();
  }, [carregarModelosDinamicos]);

  async function salvar(chave: string) {
    setSalvando(chave);
    setFeedback((prev) => {
      const next = { ...prev };
      delete next[chave];
      return next;
    });
    try {
      const res = await fetch("/api/administracao/configuracoes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chave, valor: valores[chave] }),
      });
      const payload = (await res.json()) as { error?: string };
      if (!res.ok) {
        setFeedback((prev) => ({
          ...prev,
          [chave]: {
            tipo: "error",
            mensagem: payload.error ?? "Não foi possível salvar esta configuração.",
          },
        }));
        return;
      }
      setFeedback((prev) => ({
        ...prev,
        [chave]: {
          tipo: "success",
          mensagem: "Configuração salva com sucesso.",
        },
      }));
      setTimeout(() => {
        setFeedback((prev) => {
          const next = { ...prev };
          delete next[chave];
          return next;
        });
      }, 2800);
    } catch (error) {
      setFeedback((prev) => ({
        ...prev,
        [chave]: {
          tipo: "error",
          mensagem: error instanceof Error ? error.message : "Falha inesperada ao salvar.",
        },
      }));
    } finally {
      setSalvando(null);
    }
  }

  const provedorAtual = (valores["ai_provider"] ?? "openai") as ProvedorIA;
  const modelosUnificados = useMemo(() => {
    const mapa = new Map<string, ModeloCatalogo>();
    for (const modelo of modelosDisponiveis) {
      mapa.set(`${modelo.provedor}:${modelo.id}`, modelo);
    }
    for (const dinamico of modelosDinamicos) {
      mapa.set(`${dinamico.provedor}:${dinamico.id}`, dinamico);
    }
    return Array.from(mapa.values()).sort((a, b) => {
      const diff = custoOrdenacao(a.custo) - custoOrdenacao(b.custo);
      if (diff !== 0) return diff;
      if (a.recomendado !== b.recomendado) return a.recomendado ? -1 : 1;
      return a.label.localeCompare(b.label);
    });
  }, [modelosDisponiveis, modelosDinamicos]);

  const modelosDoProvedorAtual = modelosUnificados.filter((m) => m.provedor === provedorAtual);
  const modeloAtual = valores.ai_model ?? "";
  const feedbackAtual = feedback.ai_model;
  const destaqueKimi = modelosUnificados.find(
    (m) => m.provedor === "ollama" && m.id === "kimi-k2.6:cloud",
  );

  return (
    <div className="space-y-6">
      {configuracoes.map((config) => (
        <div
          key={config.chave}
          className="space-y-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5"
        >
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold tracking-tight text-[var(--color-ink)]">
                {LABEL_CONFIG[config.chave] ?? config.chave}
              </p>
              {DESCRICAO_CONFIG[config.chave] && (
                <p className="text-xs text-[var(--color-muted)]">{DESCRICAO_CONFIG[config.chave]}</p>
              )}
            </div>
            {feedback[config.chave] && feedback[config.chave].tipo === "success" && (
              <span className="rounded-full border border-emerald-300 bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">
                Salvo
              </span>
            )}
          </div>

          {config.chave === "ai_provider" ? (
            <div className="space-y-4">
              {destaqueKimi ? (
                <InlineAlert title="Sugestão ativa de setup" variant="info">
                  Ollama Pro detectado com modelo <span className="font-mono">{destaqueKimi.id}</span>. Use este perfil
                  para operações intensivas sem depender de GPU local.
                </InlineAlert>
              ) : null}
              {GRUPOS_PROVEDORES.map((grupo) => (
                <div key={grupo.label}>
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-muted)]">
                    {grupo.label}
                  </p>
                  {grupo.obs && (
                    <p className="mb-2 text-xs text-[var(--color-muted)]">{grupo.obs}</p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {grupo.provedores.map((p) => (
                      <button
                        type="button"
                        key={p}
                        onClick={() => setValores((prev) => ({ ...prev, [config.chave]: p }))}
                        className={`rounded-xl border px-3 py-1.5 text-sm font-medium transition ${
                          provedorAtual === p
                            ? TONALIDADE_PROVEDOR[p]
                            : "border-[var(--color-border)] text-[var(--color-muted)] hover:bg-[var(--color-surface-alt)]"
                        }`}
                      >
                        {LABEL_PROVEDOR[p]}
                        {p === "ollama" && (
                          <span className="ml-1.5 rounded bg-lime-200 px-1.5 py-0.5 text-[10px] font-semibold text-lime-900">
                            local/pro
                          </span>
                        )}
                        {p === "custom" && (
                          <span className="ml-1.5 rounded bg-amber-200 px-1.5 py-0.5 text-[10px] font-semibold text-amber-900">
                            custom
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                  <p className="mt-2 text-[11px] text-[var(--color-muted)]">Variáveis necessárias: {grupo.envVar}</p>
                </div>
              ))}

              {feedback[config.chave] && feedback[config.chave].tipo === "error" ? (
                <InlineAlert title="Falha ao salvar" variant="warning">
                  {feedback[config.chave].mensagem}
                </InlineAlert>
              ) : null}

              <button
                type="button"
                onClick={() => salvar(config.chave)}
                disabled={salvando === config.chave}
                className="mt-1 rounded-xl bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {salvando === config.chave ? "Salvando provedor..." : "Salvar provedor"}
              </button>
            </div>

          ) : config.chave === "ai_model" ? (
            <div className="space-y-4">
              <TextInput
                label="ID do modelo"
                value={modeloAtual}
                onChange={(e) => setValores((prev) => ({ ...prev, [config.chave]: e.target.value }))}
                helperText="Exemplo: gpt-4o-mini, anthropic/claude-sonnet-4-5 ou kimi-k2.6:cloud"
                placeholder={
                  provedorAtual === "ollama"
                    ? "kimi-k2.6:cloud"
                    : provedorAtual === "custom"
                      ? "nome-do-modelo-no-endpoint-custom"
                      : "gpt-4o-mini"
                }
                className="font-mono"
              />

              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-3">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-muted)]">
                    Modelos do provedor selecionado ({LABEL_PROVEDOR[provedorAtual]})
                  </p>
                  <button
                    type="button"
                    onClick={() => void carregarModelosDinamicos()}
                    className="rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] px-2.5 py-1 text-xs font-medium text-[var(--color-muted)] hover:text-[var(--color-ink)]"
                  >
                    Atualizar lista
                  </button>
                </div>

                {carregandoModelos ? (
                  <p className="text-xs text-[var(--color-muted)]">Consultando modelos dinâmicos...</p>
                ) : null}
                {erroModelos ? (
                  <InlineAlert title="Modelos dinâmicos indisponíveis" variant="warning">
                    {erroModelos}
                  </InlineAlert>
                ) : null}

                {modelosDoProvedorAtual.length === 0 ? (
                  <p className="text-xs text-[var(--color-muted)]">
                    Não há modelos detectados para este provedor no momento.
                  </p>
                ) : (
                  <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
                    {modelosDoProvedorAtual.map((m) => (
                      <button
                        type="button"
                        key={`${m.provedor}:${m.id}`}
                        onClick={() => setValores((prev) => ({ ...prev, [config.chave]: m.id }))}
                        className={`w-full rounded-xl border px-3 py-2 text-left transition ${
                          modeloAtual === m.id
                            ? "border-[var(--color-accent)] bg-[var(--color-accent)]/10"
                            : "border-[var(--color-border)] bg-[var(--color-card)] hover:border-[var(--color-accent)]/40"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-xs text-[var(--color-ink)]">{m.id}</span>
                          <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-[var(--color-muted)]">
                            {STATUS_CUSTO[m.custo]}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-[var(--color-muted)]">
                          {m.label}
                          {m.recomendado ? " · recomendado" : ""}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {feedbackAtual && feedbackAtual.tipo === "error" ? (
                <InlineAlert title="Falha ao salvar modelo" variant="warning">
                  {feedbackAtual.mensagem}
                </InlineAlert>
              ) : null}

              <button
                type="button"
                onClick={() => salvar(config.chave)}
                disabled={salvando === config.chave}
                className="rounded-xl bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {salvando === config.chave ? "Salvando modelo..." : "Salvar modelo"}
              </button>
            </div>

          ) : config.chave === "tema" ? (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {[
                  { valor: "claro", label: "Claro", icon: SunIcon },
                  { valor: "escuro", label: "Escuro", icon: MoonIcon },
                  { valor: "sistema", label: "Sistema", icon: SettingsIcon },
                ].map((t) => (
                  <button
                    key={t.valor}
                    type="button"
                    onClick={() => {
                      setValores((prev) => ({ ...prev, [config.chave]: t.valor }));
                      aplicarTema(t.valor as "claro" | "escuro" | "sistema");
                    }}
                    className={`rounded-xl border px-3 py-1.5 text-sm font-medium transition ${
                      valores[config.chave] === t.valor
                        ? "border-[var(--color-accent)] bg-[var(--color-accent)] text-white"
                        : "border-[var(--color-border)] text-[var(--color-muted)] hover:bg-[var(--color-surface-alt)]"
                    }`}
                  >
                    <span className="inline-flex items-center gap-1.5">
                      <t.icon size={14} />
                      {t.label}
                    </span>
                  </button>
                ))}
              </div>

              {feedback[config.chave] && feedback[config.chave].tipo === "error" ? (
                <InlineAlert title="Falha ao salvar tema" variant="warning">
                  {feedback[config.chave].mensagem}
                </InlineAlert>
              ) : null}

              <button
                type="button"
                onClick={() => salvar(config.chave)}
                disabled={salvando === config.chave}
                className="rounded-xl bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {salvando === config.chave ? "Salvando..." : "Salvar tema"}
              </button>
            </div>

          ) : (
            <div className="space-y-3">
              <TextInput
                label={LABEL_CONFIG[config.chave] ?? config.chave}
                value={valores[config.chave] ?? ""}
                onChange={(e) => setValores((prev) => ({ ...prev, [config.chave]: e.target.value }))}
                type={config.chave === "prazo_alerta_dias" ? "number" : "text"}
                min={config.chave === "prazo_alerta_dias" ? 0 : undefined}
              />
              {feedback[config.chave] && feedback[config.chave].tipo === "error" ? (
                <InlineAlert title="Falha ao salvar configuração" variant="warning">
                  {feedback[config.chave].mensagem}
                </InlineAlert>
              ) : null}
              <button
                type="button"
                onClick={() => salvar(config.chave)}
                disabled={salvando === config.chave}
                className="rounded-xl bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {salvando === config.chave ? "Salvando..." : "Salvar configuração"}
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
