/**
 * Streaming loading skeleton — Next.js App Router
 * Substitui app/loading.tsx para progressive loading de rotas no (hub).
 */
export default function Loading() {
  return (
    <div className="flex animate-pulse flex-col gap-5">
      <div className="rounded-[1.75rem] border border-[var(--color-border)] bg-[var(--color-card)] px-6 py-6 shadow-[var(--shadow-card)]">
        <div>
          <div className="mb-2 h-3 w-24 rounded-full bg-[var(--color-border)]" />
          <div className="h-10 w-72 rounded-full bg-[var(--color-border)]" />
          <div className="mt-3 h-4 w-96 rounded-full bg-[var(--color-border)]" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-[var(--shadow-card)]"
          >
            <div className="mb-3 h-3 w-16 rounded-full bg-[var(--color-border)]" />
            <div className="mb-2 h-8 w-24 rounded-full bg-[var(--color-border)]" />
            <div className="h-3 w-28 rounded-full bg-[var(--color-border)]" />
          </div>
        ))}
      </div>

      <div className="rounded-[1.6rem] border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-[var(--shadow-card)]">
        <div className="mb-4 flex gap-2">
          <div className="h-10 w-32 rounded-2xl bg-[var(--color-border)]" />
          <div className="h-10 w-32 rounded-2xl bg-[var(--color-border)]" />
        </div>
        <div className="space-y-2">
          <div className="flex gap-4 border-b border-[var(--color-border)] pb-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-3 w-20 rounded-full bg-[var(--color-border)]" />
            ))}
          </div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex gap-4 py-3">
              {[...Array(5)].map((_, j) => (
                <div key={j} className="h-4 w-24 rounded-full bg-[var(--color-border)]" />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
