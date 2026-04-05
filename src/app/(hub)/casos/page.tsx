import Link from "next/link";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { listarCasos } from "@/modules/casos/application/listarCasos";
import type { Caso } from "@/modules/casos/domain/types";
import { formatarData } from "@/lib/utils";

const NovoCasoButton = (
  <Link
    href="/casos/novo"
    className="rounded-xl bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--color-accent-strong)]"
  >
    + Novo caso
  </Link>
);

export default async function CasosPage() {
  const casos = await listarCasos();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Casos"
        description="Lista central de casos com prazo, matéria e rastreio de evolução jurídica."
        actions={NovoCasoButton}
      />

      {casos.length === 0 ? (
        <EmptyState title="Nenhum caso encontrado" message="Cadastre um novo caso para iniciar o fluxo de produção." />
      ) : (
        <DataTable<Caso>
          rows={casos}
          columns={[
            {
              key: "id",
              title: "Caso",
              render: (caso) => (
                <div>
                  <p className="font-semibold">{caso.id}</p>
                  <p className="text-xs text-[var(--color-muted)]">{caso.titulo}</p>
                </div>
              ),
            },
            {
              key: "cliente",
              title: "Cliente",
              render: (caso) => caso.cliente,
            },
            {
              key: "materia",
              title: "Matéria",
              render: (caso) => caso.materia,
            },
            {
              key: "prazo",
              title: "Prazo",
              render: (caso) => formatarData(caso.prazoFinal),
            },
            {
              key: "status",
              title: "Status",
              render: (caso) => <StatusBadge label={caso.status} variant="implantacao" />,
            },
            {
              key: "acao",
              title: "Ação",
              render: (caso) => (
                <Link href={`/casos/${caso.id}`} className="font-semibold text-[var(--color-accent)]">
                  Abrir detalhe
                </Link>
              ),
            },
          ]}
        />
      )}
    </div>
  );
}
