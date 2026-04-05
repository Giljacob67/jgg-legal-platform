"use client";

import { useState } from "react";
import type { ConfiguracaoSistema } from "../domain/types";
import type { ModeloCatalogo } from "@/lib/ai/provider";

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
  ai_model: "Modelo de linguagem padrão. Cole o ID exato do modelo (ex: gpt-4o-mini).",
  prazo_alerta_dias: "Quantos dias antes do vencimento o sistema emite um alerta.",
  nome_escritorio: "Nome exibido no cabeçalho da plataforma.",
  tema: "Escolha entre claro, escuro ou seguir configuração do sistema.",
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

  const modelosGratuitos = modelosDisponiveis.filter((m) => m.custo === "gratuito");
  const modelosPagos = modelosDisponiveis.filter((m) => m.custo !== "gratuito");

  // Agrupa modelos pagos por provedorLabel
  const modelosPorProvedor = modelosPagos.reduce<Record<string, typeof modelosPagos>>((acc, m) => {
    const grupo = m.provedorLabel;
    if (!acc[grupo]) acc[grupo] = [];
    acc[grupo].push(m);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Configurações gerais */}
      <div className="space-y-4">
        {configuracoes.map((config) => (
          <div key={config.chave} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-4">
            <div className="mb-2 flex items-center justify-between">
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

            {config.chave === "ai_provider" ? (
              <div className="flex gap-2">
                {["openai", "openrouter", "kilocode"].map((p) => (
                  <button
                    key={p}
                    onClick={() => setValores((prev) => ({ ...prev, [config.chave]: p }))}
                    className={`rounded-xl border px-3 py-1.5 text-sm font-medium transition ${
                      valores[config.chave] === p
                        ? "border-violet-500 bg-violet-50 text-violet-800"
                        : "border-[var(--color-border)] text-[var(--color-muted)] hover:bg-[var(--color-surface-alt)]"
                    }`}
                  >
                    {p === "openai" ? "OpenAI" : p === "openrouter" ? "OpenRouter" : "KiloCode"}
                  </button>
                ))}
                <button
                  onClick={() => salvar(config.chave)}
                  disabled={salvando === config.chave}
                  className="ml-auto rounded-xl bg-[var(--color-accent)] px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {salvando === config.chave ? "Salvando..." : "Salvar"}
                </button>
              </div>
            ) : config.chave === "ai_model" ? (
              <div className="space-y-2">
                <input
                  value={valores[config.chave] ?? ""}
                  onChange={(e) => setValores((prev) => ({ ...prev, [config.chave]: e.target.value }))}
                  className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm font-mono outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/20"
                  placeholder="gpt-4o-mini"
                />
                {modelosDisponiveis.length > 0 && (
                  <details className="text-xs text-[var(--color-muted)]">
                    <summary className="cursor-pointer hover:text-[var(--color-ink)]">
                      Ver modelos disponíveis ({modelosDisponiveis.length} no total, {modelosGratuitos.length} gratuitos)
                    </summary>
                    <div className="mt-2 max-h-72 overflow-y-auto rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-2 space-y-3">
                      {/* Gratuitos */}
                      {modelosGratuitos.length > 0 && (
                        <div>
                          <p className="font-semibold text-emerald-700 mb-1 text-xs">🆓 Gratuitos</p>
                          <div className="space-y-0.5">
                            {modelosGratuitos.map((m) => (
                              <button
                                key={m.id}
                                onClick={() => setValores((prev) => ({ ...prev, [config.chave]: m.id }))}
                                className={`block w-full rounded px-2 py-1 text-left hover:bg-[var(--color-card)] font-mono text-xs ${valores[config.chave] === m.id ? "bg-[var(--color-card)] text-[var(--color-accent)] font-semibold" : ""}`}
                              >
                                {m.id}
                                <span className="ml-2 font-sans not-italic text-[var(--color-muted)]">— {m.label}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                      {/* Pagos, agrupados por provedor */}
                      {Object.entries(modelosPorProvedor).map(([grupo, modelos]) => (
                        <div key={grupo}>
                          <p className="font-semibold text-[var(--color-muted)] mb-1 text-xs">💰 {grupo}</p>
                          <div className="space-y-0.5">
                            {modelos.map((m) => (
                              <button
                                key={m.id + m.provedor}
                                onClick={() => setValores((prev) => ({ ...prev, [config.chave]: m.id }))}
                                className={`block w-full rounded px-2 py-1 text-left hover:bg-[var(--color-card)] font-mono text-xs ${valores[config.chave] === m.id ? "bg-[var(--color-card)] text-[var(--color-accent)] font-semibold" : ""}`}
                              >
                                {m.id}
                                {m.recomendado && <span className="ml-1 font-sans not-italic text-amber-600">★</span>}
                                {(m.custo === "alto") && <span className="ml-1 font-sans not-italic text-rose-400 text-[10px]">alto custo</span>}
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
                  {salvando === config.chave ? "Salvando..." : "Salvar"}
                </button>
              </div>
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
                      // 1. Atualiza o estado local do formulário
                      setValores((prev) => ({ ...prev, [config.chave]: t.valor }));
                      // 2. Aplica o tema imediatamente no DOM (preview instantâneo)
                      if (t.valor === "escuro") {
                        document.documentElement.classList.add("dark");
                        localStorage.setItem("jgg-theme", "dark");
                      } else if (t.valor === "claro") {
                        document.documentElement.classList.remove("dark");
                        localStorage.setItem("jgg-theme", "light");
                      } else {
                        // sistema: segue preferência do SO
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
    </div>
  );
}
