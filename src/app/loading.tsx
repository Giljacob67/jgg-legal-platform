export default function RootLoading() {
  return (
    <html lang="pt-BR">
      <body className="bg-[var(--color-page)]">
        <div className="flex min-h-screen items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-accent)] text-xl font-bold text-white">
              JGG
            </div>
            <div className="h-1 w-32 overflow-hidden rounded-full bg-[var(--color-border)]">
              <div className="h-full animate-pulse rounded-full bg-[var(--color-accent)]" style={{ width: "60%" }} />
            </div>
            <p className="text-sm text-[var(--color-muted)]">Carregando...</p>
          </div>
        </div>
      </body>
    </html>
  );
}
