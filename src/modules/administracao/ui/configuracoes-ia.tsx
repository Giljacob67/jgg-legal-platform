"use client";

import { useState } from "react";
import type { ConfiguracaoSistema } from "../domain/types";
import type { ModeloCatalogo, ProvedorIA } from "@/lib/ai/provider";

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
  ai_model: "Modelo de linguagem padrão. Cole o ID exato do modelo ou clique em um da lista abaixo.",
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

const COR_PROVEDOR: Record<ProvedorIA, string> = {
  openai: "border-emerald-400 bg-emerald-50 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200",
  anthropic: "border-orange-400 bg-orange-50 text-orange-900 dark:bg-orange-950 dark:text-orange-200",
  google: "border-blue-400 bg-blue-50 text-blue-900 dark:bg-blue-950 dark:text-blue-200",
  groq: "border-purple-400 bg-purple-50 text-purple-900 dark:bg-purple-950 dark:text-purple-200",
  xai: "border-gray-400 bg-gray-50 text-gray-900 dark:bg-gray-800 dark:text-gray-200",
  mistral: "border-sky-400 bg-sky-50 text-sky-900 dark:bg-sky-950 dark:text-sky-200",
  openrouter: "border-violet-400 bg-violet-50 text-violet-900 dark:bg-violet-950 dark:text-violet-200",
  kilocode: "border-indigo-400 bg-indigo-50 text-indigo-900 dark:bg-indigo-950 dark:text-indigo-200",
  ollama: "border-lime-500 bg-lime-50 text-lime-900 dark:bg-lime-950 dark:text-lime-200",
  custom: "border-amber-400 bg-amber-50 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
};

export function ConfiguracoesIA({ configuracoes, modelosDisponiveis = [] }: ConfiguracoesIAProps) {
  const [valores, setValores] = useState<Record<string, string>>(
    Object.fromEntries(configuracoes.map((c) => [c.chave, c.valor]))
  );
  const [salvando, setSalvando] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Record<string, string>>({});

  async function salvar(chave: string) {
    setSalvando(chave);
    try {
      const res = await fetch("/api/administracao/configuracoes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chave, valor: valores[chave] }),
      });
      if (res.ok) {
        setFeedback((prev) => ({ ...prev, [chave]: "✅ Salvo" }));
        setTimeout(() => setFeedback((prev) => ({ ...prev, [chave]: "" })), 2500);
      }
    } finally {
      setSalvando(null);
    }
  }

  const provedorAtual = (valores["ai_provider"] ?? "openai") as ProvedorIA;

  const modelosGratuitos = modelosDisponiveis.filter((m) => m.custo === "gratuito");
  const modelosLocais = modelosDisponiveis.filter((m) => m.custo === "local");
  const modelosPagos = modelosDisponiveis.filter((m) => m.custo !== "gratuito" && m.custo !== "local");

  const modelosPorProvedor = modelosPagos.reduce<Record<string, typeof modelosPagos>>((acc, m) => {
    const grupo = m.provedorLabel;
    if (!acc[grupo]) acc[grupo] = [];
    acc[grupo].push(m);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {configuracoes.map((config) => (
        <div key={config.chave} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-[var(--color-ink)]">
                {LABEL_CONFIG[config.chave] ?? config.chave}
              </p>
              {DESCRICAO_CONFIG[config.chave] && (
                <p className="text-xs text-[var(--color-muted)]">{DESCRICAO_CONFIG[config.chave]}</p>
              )}
            </div>
            {feedback[config.chave] && (
              <span className="text-xs text-emerald-700 font-medium">{feedback[config.chave]}</span>
            )}
          </div>

          {/* ── Provedor de IA ── */}
          {config.chave === "ai_provider" ? (
            <div className="space-y-4">
              {GRUPOS_PROVEDORES.map((grupo) => (
                <div key={grupo.label}>
                  <p className="mb-1.5 text-xs font-medium text-[var(--color-muted)]">{grupo.label}</p>
                  {grupo.obs && (
                    <p className="mb-1.5 text-xs text-[var(--color-muted)] italic">{grupo.obs}</p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {grupo.provedores.map((p) => (
                      <button
                        key={p}
                        onClick={() => setValores((prev) => ({ ...prev, [config.chave]: p }))}
                        className={`rounded-xl border px-3 py-1.5 text-sm font-medium transition ${
                          provedorAtual === p
                            ? COR_PROVEDOR[p]
                            : "border-[var(--color-border)] text-[var(--color-muted)] hover:bg-[var(--color-surface-alt)]"
                        }`}
                      >
                        {LABEL_PROVEDOR[p]}
                        {p === "ollama" && <span className="ml-1.5 rounded bg-lime-200 px-1 text-[10px] font-semibold text-lime-800">local</span>}
                        {p === "custom" && <span className="ml-1.5 rounded bg-amber-200 px-1 text-[10px] font-semibold text-amber-800">custom</span>}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              <button
                onClick={() => salvar(config.chave)}
                disabled={salvando === config.chave}
                className="mt-1 rounded-xl bg-[var(--color-accent)] px-4 py-1.5 text-sm font-semibold text-white disabled:opacity-60"
              >
                {salvando === config.chave ? "Salvando..." : "Salvar provedor"}
              </button>
            </div>

          /* ── Modelo de IA ── */
          ) : config.chave === "ai_model" ? (
            <div className="space-y-2">
              <input
                value={valores[config.chave] ?? ""}
                onChange={(e) => setValores((prev) => ({ ...prev, [config.chave]: e.target.value }))}
                className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm font-mono outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/20"
                placeholder={
                  provedorAtual === "ollama" ? "llama3.3" :
                  provedorAtual === "custom" ? "nome-do-modelo-no-seu-servidor" :
                  "gpt-4o-mini"
                }
              />

              {modelosDisponiveis.length > 0 && (
                <details className="text-xs text-[var(--color-muted)]">
                  <summary className="cursor-pointer hover:text-[var(--color-ink)]">
                    Ver modelos disponíveis ({modelosDisponiveis.length} total
                    {modelosGratuitos.length > 0 && ` · ${modelosGratuitos.length} gratuitos`}
                    {modelosLocais.length > 0 && ` · ${modelosLocais.length} locais`})
                  </summary>
                  <div className="mt-2 max-h-80 overflow-y-auto rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-2 space-y-3">

                    {/* Locais (Ollama) */}
                    {modelosLocais.length > 0 && (
                      <div>
                        <p className="font-semibold text-lime-700 mb-1 text-xs">🖥️ Ollama — local (sem custo)</p>
                        <div className="space-y-0.5">
                          {modelosLocais.map((m) => (
                            <button
                              key={m.id}
                              onClick={() => setValores((prev) => ({ ...prev, [config.chave]: m.id }))}
                              className={`block w-full rounded px-2 py-1 text-left hover:bg-[var(--color-card)] font-mono text-xs ${
                                valores[config.chave] === m.id ? "bg-[var(--color-card)] text-[var(--color-accent)] font-semibold" : ""
                              }`}
                            >
                              {m.id}
                              {m.recomendado && <span className="ml-1 font-sans not-italic text-amber-600">★</span>}
                              <span className="ml-2 font-sans not-italic text-[var(--color-muted)]">— {m.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Gratuitos (OpenRouter free tier) */}
                    {modelosGratuitos.length > 0 && (
                      <div>
                        <p className="font-semibold text-emerald-700 mb-1 text-xs">🆓 Gratuitos (OpenRouter)</p>
                        <div className="space-y-0.5">
                          {modelosGratuitos.map((m) => (
                            <button
                              key={m.id}
                              onClick={() => setValores((prev) => ({ ...prev, [config.chave]: m.id }))}
                              className={`block w-full rounded px-2 py-1 text-left hover:bg-[var(--color-card)] font-mono text-xs ${
                                valores[config.chave] === m.id ? "bg-[var(--color-card)] text-[var(--color-accent)] font-semibold" : ""
                              }`}
                            >
                              {m.id}
                              <span className="ml-2 font-sans not-italic text-[var(--color-muted)]">— {m.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Pagos, agrupados por provedorLabel */}
                    {Object.entries(modelosPorProvedor).map(([grupo, modelos]) => (
                      <div key={grupo}>
                        <p className="font-semibold text-[var(--color-muted)] mb-1 text-xs">💰 {grupo}</p>
                        <div className="space-y-0.5">
                          {modelos.map((m) => (
                            <button
                              key={m.id + m.provedor}
                              onClick={() => setValores((prev) => ({ ...prev, [config.chave]: m.id }))}
                              className={`block w-full rounded px-2 py-1 text-left hover:bg-[var(--color-card)] font-mono text-xs ${
                                valores[config.chave] === m.id ? "bg-[var(--color-card)] text-[var(--color-accent)] font-semibold" : ""
                              }`}
                            >
                              {m.id}
                              {m.recomendado && <span className="ml-1 font-sans not-italic text-amber-600">★</span>}
                              {m.custo === "alto" && <span className="ml-1 font-sans not-italic text-rose-400 text-[10px]">alto custo</span>}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </details>
              )}

              <button
                onClick={() => salvar(config.chave)}
                disabled={salvando === config.chave}
                className="rounded-xl bg-[var(--color-accent)] px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-60"
              >
                {salvando === config.chave ? "Salvando..." : "Salvar modelo"}
              </button>
            </div>

          /* ── Tema ── */
          ) : config.chave === "tema" ? (
            <div className="flex gap-2">
              {[
                { valor: "claro",   label: "Claro",   emoji: "☀️" },
                { valor: "escuro",  label: "Escuro",  emoji: "🌙" },
                { valor: "sistema", label: "Sistema", emoji: "💻" },
              ].map((t) => (
                <button
                  key={t.valor}
                  type="button"
                  onClick={() => {
                    setValores((prev) => ({ ...prev, [config.chave]: t.valor }));
                    if (t.valor === "escuro") {
                      document.documentElement.classList.add("dark");
                      localStorage.setItem("jgg-theme", "dark");
                    } else if (t.valor === "claro") {
                      document.documentElement.classList.remove("dark");
                      localStorage.setItem("jgg-theme", "light");
                    } else {
                      localStorage.removeItem("jgg-theme");
                      if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
                        document.documentElement.classList.add("dark");
                      } else {
                        document.documentElement.classList.remove("dark");
                      }
                    }
                  }}
                  className={`rounded-xl border px-3 py-1.5 text-sm font-medium transition ${
                    valores[config.chave] === t.valor
                      ? "border-[var(--color-accent)] bg-[var(--color-accent)] text-white"
                      : "border-[var(--color-border)] text-[var(--color-muted)] hover:bg-[var(--color-surface-alt)]"
                  }`}
                >
                  {t.emoji} {t.label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => salvar(config.chave)}
                disabled={salvando === config.chave}
                className="ml-auto rounded-xl bg-[var(--color-accent)] px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-60"
              >
                {salvando === config.chave ? "Salvando..." : "Salvar"}
              </button>
            </div>

          /* ── Campo genérico ── */
          ) : (
            <div className="flex gap-2">
              <input
                value={valores[config.chave] ?? ""}
                onChange={(e) => setValores((prev) => ({ ...prev, [config.chave]: e.target.value }))}
                className="flex-1 rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/20"
              />
              <button
                onClick={() => salvar(config.chave)}
                disabled={salvando === config.chave}
                className="rounded-xl bg-[var(--color-accent)] px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-60"
              >
                {salvando === config.chave ? "..." : "Salvar"}
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
