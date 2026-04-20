import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button-link";
import { StatusBadge } from "@/components/ui/status-badge";
import { ListaClientes } from "@/modules/clientes/ui/lista-clientes";
import { listarClientes } from "@/modules/clientes/application";
import { PlusIcon } from "@/components/ui/icons";

export default async function ClientesPage() {
  const clientes = await listarClientes();
  const ativos = clientes.filter((c) => c.status === "ativo").length;
  const prospectos = clientes.filter((c) => c.status === "prospecto").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clientes"
        description={`${clientes.length} clientes · ${ativos} ativos · ${prospectos} prospectos`}
        meta={
          <>
            <StatusBadge label={`${ativos} ativos`} variant="sucesso" />
            <StatusBadge label={`${prospectos} prospectos`} variant="neutro" />
          </>
        }
        actions={<ButtonLink href="/clientes/novo" label="Novo cliente" icon={<PlusIcon size={16} />} />}
      />

      <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
        {(["ativo", "prospecto", "inativo", "encerrado"] as const).map((s) => (
          <div key={s} className="rounded-[1.4rem] border border-[var(--color-border)] bg-[var(--color-card)] p-5 text-center shadow-[var(--shadow-card)]">
            <p className="font-serif text-4xl text-[var(--color-ink)]">{clientes.filter((c) => c.status === s).length}</p>
            <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-muted-strong)]">{s}</p>
          </div>
        ))}
      </div>

      <Card title="Base de clientes" subtitle="Ordenados por nome." eyebrow="Relacionamento">
        <ListaClientes clientes={clientes} />
      </Card>
    </div>
  );
}
