import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { ListaClientes } from "@/modules/clientes/ui/lista-clientes";
import { listarClientes } from "@/modules/clientes/application";
import Link from "next/link";

export default async function ClientesPage() {
  const clientes = await listarClientes();
  const ativos = clientes.filter((c) => c.status === "ativo").length;
  const prospectos = clientes.filter((c) => c.status === "prospecto").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <PageHeader title="Clientes" description={`${clientes.length} clientes · ${ativos} ativos · ${prospectos} prospectos`} />
        <Link href="/clientes/novo" className="rounded-xl bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--color-accent-strong)]">
          + Novo cliente
        </Link>
      </div>

      <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
        {(["ativo", "prospecto", "inativo", "encerrado"] as const).map((s) => (
          <div key={s} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-4 text-center">
            <p className="text-2xl font-bold text-[var(--color-ink)]">{clientes.filter((c) => c.status === s).length}</p>
            <p className="text-xs font-medium text-[var(--color-muted)] capitalize">{s}</p>
          </div>
        ))}
      </div>

      <Card title="Base de clientes" subtitle="Ordenados por nome.">
        <ListaClientes clientes={clientes} />
      </Card>
    </div>
  );
}
