import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--color-page)] px-4">
      <div className="max-w-lg rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-8 text-center shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">Erro 404</p>
        <h1 className="mt-2 font-serif text-2xl font-bold text-[var(--color-ink)]">Página não encontrada</h1>
        <p className="mt-3 text-sm text-[var(--color-muted)]">
          O recurso solicitado não existe ou foi movido.
        </p>
        <Link
          href="/dashboard"
          className="mt-6 inline-flex rounded-xl bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-white"
        >
          Voltar ao dashboard
        </Link>
      </div>
    </main>
  );
}
