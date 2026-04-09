/**
 * Streaming loading skeleton — Next.js App Router
 * Substitui app/loading.tsx para progressive loading de rotas no (hub).
 */
export default function Loading() {
  return (
    <div className="flex animate-pulse flex-col gap-5 px-5 py-4">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div>
          <div className="mb-1 h-3 w-24 rounded bg-[var(--color-border)]" />
          <div className="h-5 w-48 rounded bg-[var(--color-border)]" />
        </div>
        <div className="h-9 w-9 rounded-xl bg-[var(--color-border)]" />
      </div>

      {/* Page header */}
      <div className="mb-2 flex items-center justify-between">
        <div>
          <div className="h-7 w-40 rounded bg-[var(--color-border)]" />
          <div className="mt-1 h-4 w-64 rounded bg-[var(--color-border)]" />
        </div>
        <div className="h-10 w-32 rounded-xl bg-[var(--color-border)]" />
      </div>

      {/* Cards skeleton (dashboard) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5"
          >
            <div className="mb-3 h-3 w-16 rounded bg-[var(--color-border)]" />
            <div className="mb-1 h-7 w-20 rounded bg-[var(--color-border)]" />
            <div className="h-3 w-28 rounded bg-[var(--color-border)]" />
          </div>
        ))}
      </div>

      {/* Table skeleton */}
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
        <div className="mb-4 flex gap-2">
          <div className="h-9 w-32 rounded-xl bg-[var(--color-border)]" />
          <div className="h-9 w-32 rounded-xl bg-[var(--color-border)]" />
        </div>
        <div className="space-y-2">
          <div className="flex gap-4 border-b border-[var(--color-border)] pb-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-3 w-20 rounded bg-[var(--color-border)]" />
            ))}
          </div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex gap-4 py-3">
              {[...Array(5)].map((_, j) => (
                <div key={j} className="h-4 w-24 rounded bg-[var(--color-border)]" />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}