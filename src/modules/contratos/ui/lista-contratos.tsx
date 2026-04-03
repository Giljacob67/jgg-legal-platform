import Link from "next/link";
import type { Contrato } from "../domain/types";
import { LABEL_TIPO_CONTRATO, LABEL_STATUS_CONTRATO, STATUS_CONTRATO_COR } from "../domain/types";

type ListaContratosProps = {
  contratos: Contrato[];
};

function formatarValor(centavos: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(centavos / 100);
}

function formatarData(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR");
}

export function ListaContratos({ contratos }: ListaContratosProps) {
  if (contratos.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface-alt)] py-12 text-center">
        <p className="text-2xl">📄</p>
        <p className="mt-2 text-sm font-medium text-[var(--color-muted)]">Nenhum contrato cadastrado.</p>
        <Link
          href="/contratos/novo"
          className="mt-3 inline-block rounded-xl bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-white"
        >
          Criar primeiro contrato
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {contratos.map((c) => (
        <Link
          key={c.id}
          href={`/contratos/${c.id}`}
          className="group flex items-start justify-between gap-4 rounded-xl border border-[var(--color-border)] bg-white p-4 transition hover:border-[var(--color-accent)] hover:shadow-sm"
        >
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${STATUS_CONTRATO_COR[c.status]}`}>
                {LABEL_STATUS_CONTRATO[c.status]}
              </span>
              <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-2.5 py-0.5 text-xs text-[var(--color-muted)]">
                {LABEL_TIPO_CONTRATO[c.tipo]}
              </span>
              {c.casoId && (
                <span className="text-xs text-[var(--color-muted)]">⚖️ {c.casoId}</span>
              )}
            </div>
            <p className="mt-1.5 font-semibold text-[var(--color-ink)] group-hover:text-[var(--color-accent)] truncate">
              {c.titulo}
            </p>
            <p className="mt-0.5 text-xs text-[var(--color-muted)] truncate">{c.objeto}</p>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-[var(--color-muted)]">
              {c.valorReais && <span>💰 {formatarValor(c.valorReais)}</span>}
              {c.vigenciaInicio && c.vigenciaFim && (
                <span>📅 {formatarData(c.vigenciaInicio)} → {formatarData(c.vigenciaFim)}</span>
              )}
              <span>{c.partes.length} parte(s)</span>
              {c.analiseRisco && (
                <span className={`font-semibold ${c.analiseRisco.nivel === "critico" || c.analiseRisco.nivel === "alto" ? "text-rose-600" : c.analiseRisco.nivel === "moderado" ? "text-amber-600" : "text-emerald-600"}`}>
                  Risco: {c.analiseRisco.nivel} ({c.analiseRisco.pontuacaoRisco}/100)
                </span>
              )}
            </div>
          </div>
          <span className="mt-1 text-[var(--color-muted)] group-hover:text-[var(--color-accent)]">→</span>
        </Link>
      ))}
    </div>
  );
}
