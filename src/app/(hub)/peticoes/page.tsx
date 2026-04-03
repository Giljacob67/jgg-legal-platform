import Link from "next/link";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { listarPedidosDePeca } from "@/modules/peticoes/application/listarPedidosDePeca";
import { formatarData } from "@/lib/utils";

export default async function PeticoesPage() {
  const pedidos = await listarPedidosDePeca();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Petições"
        description="Centro de produção jurídica com pipeline, auditoria e editor de minuta."
      />

      <Card title="Fluxo de produção jurídica">
        <p className="text-sm text-[var(--color-muted)]">
          O módulo Petições organiza o trabalho por etapas especializadas para que o redator final não seja o primeiro
          leitor do caso.
        </p>
        <div className="flex flex-wrap gap-2 pt-2">
          <Link
            href="/peticoes/novo"
            className="rounded-xl bg-[var(--color-accent)] px-3 py-1.5 text-sm font-semibold text-white"
          >
            Novo pedido de peça
          </Link>
          <Link
            href="/peticoes/base-juridica"
            className="rounded-xl border border-[var(--color-border)] px-3 py-1.5 text-sm font-semibold hover:bg-[var(--color-surface-alt)]"
          >
            Base jurídica viva
          </Link>
        </div>
      </Card>

      <Card title="Pedidos ativos" subtitle="Itens com andamento atual no pipeline.">
        <div className="grid gap-3 md:grid-cols-2">
          {pedidos.map((pedido) => (
            <article key={pedido.id} className="rounded-xl border border-[var(--color-border)] p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold text-[var(--color-ink)]">{pedido.id}</p>
                <StatusBadge label={pedido.status} variant="implantacao" />
              </div>
              <p className="mt-1 text-sm text-[var(--color-muted)]">{pedido.titulo}</p>
              <p className="mt-1 text-xs text-[var(--color-muted)]">
                Prazo: {formatarData(pedido.prazoFinal)} • Responsável: {pedido.responsavel}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Link href={`/peticoes/pedidos/${pedido.id}`} className="text-sm font-semibold text-[var(--color-accent)]">
                  Detalhe
                </Link>
                <Link href={`/peticoes/pipeline/${pedido.id}`} className="text-sm font-semibold text-[var(--color-accent)]">
                  Pipeline
                </Link>
              </div>
            </article>
          ))}
        </div>
      </Card>
    </div>
  );
}
