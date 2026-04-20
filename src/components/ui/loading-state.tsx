export function LoadingState() {
  return (
    <div className="rounded-[1.6rem] border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-[var(--shadow-card)]">
      <div className="animate-pulse space-y-3">
        <div className="h-3 w-28 rounded-full bg-[var(--color-border)]" />
        <div className="h-5 w-56 rounded-full bg-[var(--color-border)]" />
        <div className="h-4 w-40 rounded-full bg-[var(--color-border)]" />
      </div>
    </div>
  );
}
