"use client";

import { useState, useTransition, useRef } from "react";
import type { Jurisprudencia } from "../domain/types";
import { LABEL_TIPO_DECISAO } from "../domain/types";
import Link from "next/link";

type BuscadorJurisprudenciaProps = {
  resultadosIniciais: Jurisprudencia[];
};

function CardJurisprudencia({ j, semântico }: { j: Jurisprudencia; semântico?: boolean }) {
  const relevanciaStars = "★".repeat(j.relevancia) + "☆".repeat(5 - j.relevancia);
  return (
    <Link
      href={`/jurisprudencia/${j.id}`}
      className="group block rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-4 transition hover:border-[var(--color-accent)] hover:shadow-sm"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="rounded-full border border-violet-200 bg-violet-50 px-2.5 py-0.5 text-xs font-bold text-violet-800">{j.tribunal}</span>
            <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-2.5 py-0.5 text-xs text-[var(--color-muted)]">{LABEL_TIPO_DECISAO[j.tipo]}</span>
            {j.dataJulgamento && (
              <span className="text-xs text-[var(--color-muted)]">{new Date(j.dataJulgamento).toLocaleDateString("pt-BR")}</span>
            )}
            <span className="text-xs text-amber-500" title={`Relevância: ${j.relevancia}/5`}>{relevanciaStars}</span>
            {semântico && (
              <span className="rounded-full border border-violet-300 bg-violet-100 px-2 py-0.5 text-xs text-violet-700">semântico</span>
            )}
          </div>
          <p className="font-semibold text-sm text-[var(--color-ink)] group-hover:text-[var(--color-accent)] leading-snug">{j.titulo}</p>
          {j.ementaResumida ? (
            <p className="mt-1.5 text-xs text-[var(--color-muted)] leading-relaxed line-clamp-2">{j.ementaResumida}</p>
          ) : (
            <p className="mt-1.5 text-xs text-[var(--color-muted)] leading-relaxed line-clamp-2">{j.ementa}</p>
          )}
          {j.tese && (
            <p className="mt-2 border-l-2 border-violet-300 pl-2 text-xs text-violet-700 italic">{j.tese}</p>
          )}
          <div className="mt-2 flex flex-wrap gap-1">
            {j.materias.slice(0, 4).map((m) => (
              <span key={m} className="rounded-full bg-[var(--color-surface-alt)] border border-[var(--color-border)] px-2 py-0.5 text-xs text-[var(--color-muted)]">{m}</span>
            ))}
          </div>
        </div>
        <span className="text-[var(--color-muted)] group-hover:text-[var(--color-accent)] text-lg">→</span>
      </div>
    </Link>
  );
}

export function BuscadorJurisprudencia({ resultadosIniciais }: BuscadorJurisprudenciaProps) {
  const [query, setQuery] = useState("");
  const [resultados, setResultados] = useState<Jurisprudencia[]>(resultadosIniciais);
  const [modoSemantico, setModoSemantico] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [indexando, setIndexando] = useState(false);
  const [msgIndexacao, setMsgIndexacao] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function buscar(q: string, semantico: boolean) {
    if (!q.trim()) {
      const res = await fetch("/api/jurisprudencia");
      if (res.ok) {
        const data = await res.json() as { jurisprudencias: Jurisprudencia[] };
        setResultados(data.jurisprudencias);
      }
      return;
    }

    if (semantico) {
      const res = await fetch("/api/jurisprudencia/busca-semantica", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q }),
      });
      if (res.ok) {
        const data = await res.json() as { jurisprudencias: Jurisprudencia[] };
        setResultados(data.jurisprudencias);
      }
    } else {
      const res = await fetch(`/api/jurisprudencia?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json() as { jurisprudencias: Jurisprudencia[] };
        setResultados(data.jurisprudencias);
      }
    }
  }

  function handleInput(q: string) {
    setQuery(q);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      startTransition(() => { void buscar(q, modoSemantico); });
    }, modoSemantico ? 600 : 250);
  }

  function toggleModo() {
    const novoModo = !modoSemantico;
    setModoSemantico(novoModo);
    if (query.trim()) {
      startTransition(() => { void buscar(query, novoModo); });
    }
  }

  async function indexarTodos() {
    setIndexando(true);
    setMsgIndexacao(null);
    try {
      const res = await fetch("/api/jurisprudencia/indexar-todos", { method: "POST" });
      const data = await res.json() as { indexados?: number; erros?: number; mensagem?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Erro ao indexar.");
      if (data.mensagem) {
        setMsgIndexacao(data.mensagem);
      } else {
        setMsgIndexacao(`${data.indexados} indexado(s)${data.erros ? `, ${data.erros} erro(s)` : ""}.`);
      }
    } catch (e) {
      setMsgIndexacao(e instanceof Error ? e.message : "Erro ao indexar.");
    } finally {
      setIndexando(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Controles de busca */}
      <div className="flex gap-2 items-center flex-wrap">
        <div className="relative flex-1 min-w-[240px]">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)] text-sm">
            {modoSemantico ? "✦" : "🔍"}
          </span>
          <input
            value={query}
            onChange={(e) => handleInput(e.target.value)}
            placeholder={
              modoSemantico
                ? "Descreva o que você procura em linguagem natural..."
                : "Pesquise por tese, matéria, tribunal, relator..."
            }
            className="w-full rounded-xl border border-[var(--color-border)] py-3 pl-9 pr-4 text-sm outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/20"
          />
          {isPending && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--color-muted)]">
              buscando...
            </span>
          )}
        </div>

        {/* Toggle modo semântico */}
        <button
          onClick={toggleModo}
          title={modoSemantico ? "Modo: semântico (IA) — clique para voltar ao texto" : "Modo: texto — clique para ativar busca semântica"}
          className={`rounded-xl border px-3 py-2.5 text-xs font-semibold transition-colors ${
            modoSemantico
              ? "border-violet-300 bg-violet-100 text-violet-700 hover:bg-violet-200"
              : "border-[var(--color-border)] bg-[var(--color-surface-alt)] text-[var(--color-muted)] hover:text-[var(--color-ink)]"
          }`}
        >
          {modoSemantico ? "✦ Semântico" : "Semântico"}
        </button>

        {/* Botão indexar */}
        <button
          onClick={indexarTodos}
          disabled={indexando}
          title="Gerar embeddings para registros pendentes de indexação"
          className="rounded-xl border border-[var(--color-border)] px-3 py-2.5 text-xs text-[var(--color-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-surface-alt)] disabled:opacity-50 transition-colors"
        >
          {indexando ? "Indexando..." : "Indexar"}
        </button>
      </div>

      {/* Mensagem de indexação */}
      {msgIndexacao && (
        <p className="text-xs text-[var(--color-muted)] bg-[var(--color-surface-alt)] rounded-lg px-3 py-2">
          {msgIndexacao}
        </p>
      )}

      {/* Modo semântico explicação */}
      {modoSemantico && (
        <p className="text-xs text-violet-600 bg-violet-50 border border-violet-200 rounded-lg px-3 py-2">
          Busca semântica ativa — descreva o que você procura em linguagem natural. Ex: &quot;impenhorabilidade de imóvel rural em execução fiscal&quot;
        </p>
      )}

      <p className="text-xs text-[var(--color-muted)]">
        {resultados.length} resultado(s) {query && `para "${query}"`}
      </p>

      <div className="space-y-3">
        {resultados.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[var(--color-border)] py-12 text-center text-sm text-[var(--color-muted)]">
            Nenhuma jurisprudência encontrada para esta busca.
          </div>
        ) : (
          resultados.map((j) => (
            <CardJurisprudencia key={j.id} j={j} semântico={modoSemantico && query.trim().length > 0} />
          ))
        )}
      </div>
    </div>
  );
}
