"use client";

import { useEffect } from "react";
import { AlertTriangleIcon } from "@/components/ui/icons";

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
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
      <div className="w-full max-w-xl rounded-[1.8rem] border border-[var(--color-border)] bg-[var(--color-card)] p-8 text-center shadow-[var(--shadow-card)]">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[1.35rem] border border-[var(--color-warning-border)] bg-[var(--color-warning-bg)] text-[var(--color-warning-ink)]">
          <AlertTriangleIcon size={24} />
        </div>

        <div className="mt-6">
          <h1 className="font-serif text-3xl text-[var(--color-ink)]">
            Algo deu errado
          </h1>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-[var(--color-muted)]">
            Ocorreu um erro inesperado. Se o problema persistir, entre em contato
            com o suporte.
          </p>
          {error.digest && (
            <p className="mt-2 font-mono text-xs text-[var(--color-muted)]">
              ID: {error.digest}
            </p>
          )}
        </div>

        <div className="mt-8 flex justify-center gap-3">
          <button
            onClick={reset}
            className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] px-5 py-2.5 text-sm font-medium text-[var(--color-ink)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
          >
            Tentar novamente
          </button>
          <a
            href="/dashboard"
            className="rounded-2xl bg-[var(--color-accent)] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[var(--color-accent-strong)]"
          >
            Voltar ao Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
