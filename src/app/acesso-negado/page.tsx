import Link from "next/link";

export default function AcessoNegadoPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-[var(--color-page)] p-6">
      <section className="max-w-lg rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-6 text-center shadow-sm">
        <h1 className="font-serif text-3xl text-[var(--color-ink)]">Acesso não autorizado</h1>
        <p className="mt-2 text-sm text-[var(--color-muted)]">
          Não encontramos uma sessão simulada ativa para acessar o HUB.
        </p>
        <Link
          href="/dashboard"
          className="mt-5 inline-flex rounded-xl bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-white"
        >
          Voltar ao dashboard
        </Link>
      </section>
    </main>
  );
}
