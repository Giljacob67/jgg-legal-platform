import Link from "next/link";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { obterVisaoDashboard } from "@/modules/dashboard/application/obterVisaoDashboard";
import { listarCasos } from "@/modules/casos/application/listarCasos";
import { listarPedidosDePeca } from "@/modules/peticoes/application/listarPedidosDePeca";
import { formatarData } from "@/lib/utils";

function formatarTimestamp(iso: string): string {
  const d = new Date(iso);
  const hoje = new Date();
  const ontem = new Date(hoje);
  ontem.setDate(hoje.getDate() - 1);

  const hora = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  if (d.toDateString() === hoje.toDateString()) return `Hoje • ${hora}`;
  if (d.toDateString() === ontem.toDateString()) return `Ontem • ${hora}`;
  return `${formatarData(d.toISOString().split("T")[0])} • ${hora}`;
}

export default async function DashboardPage() {
  const visao = await obterVisaoDashboard();
  const casos = (await listarCasos()).slice(0, 3);
  const pedidos = await listarPedidosDePeca();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Painel executivo da operação jurídica com foco em produção, prazos e revisão técnica."
      />

      {/* Quick actions */}
      <section className="flex flex-wrap gap-3">
        <Link
          href="/peticoes/novo"
          className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-accent)] bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
        >
          ⚖️ Novo pedido
        </Link>
        <Link
          href="/casos"
          className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-2 text-sm font-semibold text-[var(--color-ink)] shadow-sm transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
        >
          📁 Novo caso
        </Link>
        <Link
          href="/documentos"
          className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-2 text-sm font-semibold text-[var(--color-ink)] shadow-sm transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
        >
          🗂️ Upload documento
        </Link>
        <Link
          href="/contratos"
          className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-2 text-sm font-semibold text-[var(--color-ink)] shadow-sm transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
        >
          📄 Novo contrato
        </Link>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {visao.indicadores.map((indicador) => (
          <StatCard key={indicador.id} label={indicador.label} value={indicador.valor} trend={indicador.tendencia} />
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <Card title="Casos críticos" subtitle="Priorize os prazos mais próximos da semana.">
          {casos.map((caso) => (
            <article key={caso.id} className="rounded-xl border border-[var(--color-border)] p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold text-[var(--color-ink)]">{caso.titulo}</p>
                <p className="text-xs text-[var(--color-muted)]">Prazo: {formatarData(caso.prazoFinal)}</p>
              </div>
              <p className="mt-1 text-sm text-[var(--color-muted)]">{caso.cliente}</p>
              <Link href={`/casos/${caso.id}`} className="mt-2 inline-flex text-sm font-semibold text-[var(--color-accent)]">
                Ver detalhe do caso
              </Link>
            </article>
          ))}
        </Card>

        <Card title="Petições em andamento" subtitle="Pedidos em produção no módulo de Petições.">
          {pedidos.map((pedido) => (
            <article key={pedido.id} className="rounded-xl border border-[var(--color-border)] p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold text-[var(--color-ink)]">{pedido.id}</p>
                <p className="text-xs text-[var(--color-muted)]">{pedido.status}</p>
              </div>
              <p className="mt-1 text-sm text-[var(--color-muted)]">{pedido.titulo}</p>
              <div className="mt-2 flex gap-3">
                <Link href={`/peticoes/pedidos/${pedido.id}`} className="text-sm font-semibold text-[var(--color-accent)]">
                  Abrir pedido
                </Link>
                <Link href={`/peticoes/pipeline/${pedido.id}`} className="text-sm font-semibold text-[var(--color-accent)]">
                  Abrir pipeline
                </Link>
              </div>
            </article>
          ))}
        </Card>
      </section>

      <Card title="Atividades recentes" subtitle="Rastro rápido das últimas movimentações registradas.">
        <div className="space-y-2">
          {visao.atividadesRecentes.map((atividade) => (
            <div key={atividade.id} className="flex items-center justify-between rounded-xl border border-[var(--color-border)] p-3">
              <p className="text-sm text-[var(--color-ink)]">{atividade.titulo}</p>
              <p className="whitespace-nowrap text-xs text-[var(--color-muted)]">
                {atividade.modulo} • {formatarTimestamp(atividade.timestamp)}
              </p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
