import Link from "next/link";
import type { Cliente } from "../domain/types";
import { LABEL_STATUS_CLIENTE, STATUS_CLIENTE_COR } from "../domain/types";

type ListaClientesProps = { clientes: Cliente[] };

export function ListaClientes({ clientes }: ListaClientesProps) {
  if (clientes.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[var(--color-border)] py-12 text-center">
        <p className="text-2xl">👤</p>
        <p className="mt-2 text-sm text-[var(--color-muted)]">Nenhum cliente cadastrado.</p>
        <Link href="/clientes/novo" className="mt-3 inline-block rounded-xl bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-white">
          Cadastrar primeiro cliente
        </Link>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-card)]">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-alt)]">
            <th className="px-4 py-3 text-left font-semibold text-[var(--color-muted)]">Cliente</th>
            <th className="px-4 py-3 text-left font-semibold text-[var(--color-muted)]">CPF/CNPJ</th>
            <th className="px-4 py-3 text-left font-semibold text-[var(--color-muted)]">Status</th>
            <th className="px-4 py-3 text-left font-semibold text-[var(--color-muted)]">Responsável</th>
            <th className="px-4 py-3 text-left font-semibold text-[var(--color-muted)]">Casos / Contratos</th>
            <th className="px-4 py-3 text-left font-semibold text-[var(--color-muted)]" />
          </tr>
        </thead>
        <tbody>
          {clientes.map((c, i) => (
            <tr key={c.id} className={`border-b border-[var(--color-border)] last:border-0 ${i % 2 === 0 ? "" : "bg-[var(--color-surface-alt)]/40"}`}>
              <td className="px-4 py-3">
                <p className="font-semibold text-[var(--color-ink)]">{c.nome}</p>
                <p className="text-xs text-[var(--color-muted)]">{c.tipo === "pessoa_juridica" ? "🏢 PJ" : "👤 PF"} {c.email && `· ${c.email}`}</p>
              </td>
              <td className="px-4 py-3 font-mono text-xs text-[var(--color-muted)]">{c.cpfCnpj ?? "—"}</td>
              <td className="px-4 py-3">
                <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${STATUS_CLIENTE_COR[c.status]}`}>
                  {LABEL_STATUS_CLIENTE[c.status]}
                </span>
              </td>
              <td className="px-4 py-3 text-xs text-[var(--color-muted)]">{c.responsavelNome ?? "—"}</td>
              <td className="px-4 py-3 text-xs text-[var(--color-muted)]">
                {c.casosIds.length} caso(s) · {c.contratosIds.length} contrato(s)
              </td>
              <td className="px-4 py-3">
                <Link href={`/clientes/${c.id}`} className="rounded-lg border border-[var(--color-border)] px-3 py-1 text-xs font-medium text-[var(--color-muted)] hover:bg-[var(--color-surface-alt)]">
                  Ver →
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
