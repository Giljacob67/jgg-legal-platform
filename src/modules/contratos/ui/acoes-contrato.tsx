"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";

interface Props {
  contratoId: string;
}

export function AcoesContrato({ contratoId }: Props) {
  const router = useRouter();

  async function handleExcluir() {
    if (!confirm("Excluir este contrato? Esta ação não pode ser desfeita.")) return;
    try {
      const res = await fetch(`/api/contratos/${contratoId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json() as { error?: string };
        throw new Error(data.error ?? "Erro ao excluir.");
      }
      router.push("/contratos");
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erro ao excluir.");
    }
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Link
        href={`/contratos/${contratoId}/editar`}
        className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-sm font-medium text-[var(--color-ink)] hover:bg-[var(--color-surface-alt)] transition-colors"
      >
        Editar
      </Link>
      <button
        onClick={handleExcluir}
        className="rounded-lg border border-rose-300 px-3 py-1.5 text-sm font-medium text-rose-600 hover:bg-rose-50 transition-colors"
      >
        Excluir
      </button>
    </div>
  );
}