"use client";

import { useState, useTransition } from "react";
import type { Jurisprudencia } from "../domain/types";
import { LABEL_TIPO_DECISAO } from "../domain/types";
import Link from "next/link";

type BuscadorJurisprudenciaProps = {
  resultadosIniciais: Jurisprudencia[];
};

function CardJurisprudencia({ j }: { j: Jurisprudencia }) {
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
  const [isPending, startTransition] = useTransition();

  async function buscar(q: string) {
    setQuery(q);
    startTransition(async () => {
      const url = q.trim() ? `/api/jurisprudencia?q=${encodeURIComponent(q)}` : "/api/jurisprudencia";
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json() as { jurisprudencias: Jurisprudencia[] };
        setResultados(data.jurisprudencias);
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)]">🔍</span>
        <input
          value={query}
          onChange={(e) => buscar(e.target.value)}
          placeholder="Pesquise por tese, matéria, tribunal, relator, número do acórdão..."
          className="w-full rounded-xl border border-[var(--color-border)] py-3 pl-9 pr-4 text-sm outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/20"
        />
        {isPending && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--color-muted)]">buscando...</span>
        )}
      </div>

      <p className="text-xs text-[var(--color-muted)]">
        {resultados.length} resultado(s) {query && `para "${query}"`}
      </p>

      <div className="space-y-3">
        {resultados.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[var(--color-border)] py-12 text-center text-sm text-[var(--color-muted)]">
            Nenhuma jurisprudência encontrada para esta busca.
          </div>
        ) : (
          resultados.map((j) => <CardJurisprudencia key={j.id} j={j} />)
        )}
      </div>
    </div>
  );
}
