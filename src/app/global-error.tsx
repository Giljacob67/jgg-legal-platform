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
    console.error("[global error]", error);
  }, [error]);

  return (
    <html lang="pt-BR">
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[var(--color-page)] px-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-3xl">
            ⚠️
          </div>
          <div>
            <h1 className="font-serif text-2xl font-bold text-[var(--color-ink)]">
              Erro crítico
            </h1>
            <p className="mt-2 max-w-sm text-sm text-[var(--color-muted)]">
              Ocorreu um erro que impediu o carregamento da aplicação.
            </p>
            {error.digest && (
              <p className="mt-1 font-mono text-xs text-[var(--color-muted)]">
                ID: {error.digest}
              </p>
            )}
          </div>
          <button
            onClick={reset}
            className="rounded-xl bg-[var(--color-accent)] px-6 py-2.5 text-sm font-medium text-white transition hover:bg-[var(--color-accent-strong)]"
          >
            Recarregar
          </button>
        </div>
      </body>
    </html>
  );
}