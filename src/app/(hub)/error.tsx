"use client";

import { useEffect } from "react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log no Sentry
    console.error("[error boundary]", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4 text-center">
      {/* Ícone */}
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-3xl">
        ⚠️
      </div>

      {/* Mensagem */}
      <div>
        <h1 className="font-serif text-2xl font-bold text-[var(--color-ink)]">
          Algo deu errado
        </h1>
        <p className="mt-2 max-w-sm text-sm text-[var(--color-muted)]">
          Ocorreu um erro inesperado. Se o problema persistir, entre em contato
          com o suporte.
        </p>
        {error.digest && (
          <p className="mt-1 font-mono text-xs text-[var(--color-muted)]">
            ID: {error.digest}
          </p>
        )}
      </div>

      {/* Ações */}
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-5 py-2.5 text-sm font-medium text-[var(--color-ink)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
        >
          Tentar novamente
        </button>
        <a
          href="/dashboard"
          className="rounded-xl bg-[var(--color-accent)] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[var(--color-accent-strong)]"
        >
          Voltar ao Dashboard
        </a>
      </div>
    </div>
  );
}