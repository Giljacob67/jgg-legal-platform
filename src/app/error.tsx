"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app/error]", error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--color-page)] px-4">
      <div className="max-w-lg rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-8 text-center shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">Erro inesperado</p>
        <h1 className="mt-2 font-serif text-2xl font-bold text-[var(--color-ink)]">Falha ao carregar a aplicação</h1>
        <p className="mt-3 text-sm text-[var(--color-muted)]">
          Tente novamente. Se o problema persistir, acione a equipe técnica.
        </p>
        <button
          onClick={reset}
          className="mt-6 inline-flex rounded-xl bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-white"
        >
          Tentar novamente
        </button>
      </div>
    </main>
  );
}
