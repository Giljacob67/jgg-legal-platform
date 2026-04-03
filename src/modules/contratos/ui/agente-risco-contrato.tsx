"use client";

import { useState } from "react";
import type { AnaliseRiscoContrato } from "../domain/types";

type AgenteRiscoContratoProps = {
  contratoId: string;
  analiseInicial?: AnaliseRiscoContrato;
};

const COR_NIVEL: Record<string, string> = {
  baixo: "text-emerald-700 bg-emerald-50 border-emerald-200",
  moderado: "text-amber-700 bg-amber-50 border-amber-200",
  alto: "text-rose-700 bg-rose-50 border-rose-200",
  critico: "text-rose-900 bg-rose-100 border-rose-400",
  medio: "text-amber-700 bg-amber-50 border-amber-200",
};

export function AgenteRiscoContrato({ contratoId, analiseInicial }: AgenteRiscoContratoProps) {
  const [analise, setAnalise] = useState<AnaliseRiscoContrato | undefined>(analiseInicial);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");

  async function analisar() {
    setLoading(true);
    setErro("");
    try {
      const res = await fetch(`/api/contratos/${contratoId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ acao: "analisar-risco" }),
      });
      if (!res.ok) {
        const data = await res.json() as { error?: string };
        throw new Error(data.error ?? "Erro na análise.");
      }
      const data = await res.json() as { analise: AnaliseRiscoContrato; aviso?: string };
      setAnalise(data.analise);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro inesperado.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-[var(--color-ink)]">🤖 Análise de Risco Contratual</p>
          <p className="text-xs text-[var(--color-muted)]">O agente identifica cláusulas problemáticas, lacunas jurídicas e faz recomendações.</p>
        </div>
        <button
          onClick={analisar}
          disabled={loading}
          className="rounded-xl bg-[var(--color-accent)] px-3 py-2 text-sm font-semibold text-white disabled:opacity-60 transition hover:bg-[var(--color-accent-strong)]"
        >
          {loading ? "⏳ Analisando..." : analise ? "↺ Re-analisar" : "Analisar contrato"}
        </button>
      </div>

      {erro && <p className="text-sm text-rose-700">⚠️ {erro}</p>}

      {analise && (
        <div className="space-y-3">
          {/* Pontuação geral */}
          <div className={`rounded-xl border px-4 py-3 ${COR_NIVEL[analise.nivel]}`}>
            <div className="flex items-center justify-between">
              <span className="font-bold text-base capitalize">Risco {analise.nivel}</span>
              <span className="font-mono font-bold text-xl">{analise.pontuacaoRisco}<span className="text-sm font-normal">/100</span></span>
            </div>
            <div className="mt-2 h-2 w-full rounded-full bg-white/50">
              <div
                className="h-2 rounded-full bg-current opacity-60 transition-all"
                style={{ width: `${analise.pontuacaoRisco}%` }}
              />
            </div>
          </div>

          {/* Cláusulas com risco */}
          {analise.clausulasRisco.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wide">⚠️ Cláusulas com risco</p>
              <div className="space-y-2">
                {analise.clausulasRisco.map((cr) => (
                  <div key={cr.clausulaId} className={`rounded-lg border px-3 py-2 text-xs ${COR_NIVEL[cr.nivel]}`}>
                    <p className="font-semibold">{cr.titulo} <span className="capitalize font-normal opacity-75">— risco {cr.nivel}</span></p>
                    <p className="mt-0.5 opacity-90">{cr.descricaoRisco}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Cláusulas ausentes */}
          {analise.clausulasAusentes.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wide">🔴 Cláusulas essenciais ausentes</p>
              <ul className="space-y-1">
                {analise.clausulasAusentes.map((ca, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-rose-700">
                    <span>•</span><span>{ca}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recomendações */}
          {analise.recomendacoes.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wide">💡 Recomendações</p>
              <ul className="space-y-1">
                {analise.recomendacoes.map((r, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-[var(--color-ink)]">
                    <span className="text-violet-500">{i + 1}.</span><span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <p className="text-xs text-[var(--color-muted)]">
            Analisado em: {new Date(analise.analisadoEm).toLocaleString("pt-BR")}
          </p>
        </div>
      )}

      {!analise && !loading && (
        <div className="rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface-alt)] py-8 text-center text-sm text-[var(--color-muted)]">
          Nenhuma análise realizada. Clique em &quot;Analisar contrato&quot; para que o agente de IA identifique riscos e lacunas jurídicas.
        </div>
      )}
    </div>
  );
}
