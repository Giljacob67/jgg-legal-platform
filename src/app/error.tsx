"use client";

import { useEffect } from "react";

export default function RootErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[root error boundary]", error);
  }, [error]);

  return (
    <html lang="pt-BR">
      <body className="bg-[var(--color-page)]">
        <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-3xl">
            ⚠️
          </div>
          <div>
            <h1 className="font-serif text-2xl font-bold text-[var(--color-ink)]">
              Erro crítico
            </h1>
            <p className="mt-2 max-w-sm text-sm text-[var(--color-muted)]">
              Ocorreu um erro que impediu o carregamento da aplicação.
              Recarregue a página ou volte ao dashboard.
            </p>
            {error.digest && (
              <p className="mt-1 font-mono text-xs text-[var(--color-muted)]">
                ID: {error.digest}
              </p>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={reset}
              className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-5 py-2.5 text-sm font-medium text-[var(--color-ink)] transition hover:border-[var(--color-accent)]"
            >
              Recarregar
            </button>
            <a
              href="/dashboard"
              className="rounded-xl bg-[var(--color-accent)] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[var(--color-accent-strong)]"
            >
              Dashboard
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}