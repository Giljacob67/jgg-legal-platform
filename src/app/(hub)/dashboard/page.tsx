import Link from "next/link";
import { ButtonLink } from "@/components/ui/button-link";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { FolderIcon, ScaleIcon, UploadIcon } from "@/components/ui/icons";
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
        meta={
          <>
            <StatusBadge label={`${visao.indicadores.length} indicadores`} variant="neutro" />
            <StatusBadge label={`${pedidos.length} pedidos monitorados`} variant="ativo" />
          </>
        }
        actions={
          <>
            <ButtonLink href="/peticoes/novo" label="Novo pedido" icon={<ScaleIcon size={16} />} />
            <ButtonLink href="/casos/novo" label="Novo caso" icon={<FolderIcon size={16} />} variant="secundario" />
            <ButtonLink href="/documentos" label="Enviar documento" icon={<UploadIcon size={16} />} variant="secundario" />
          </>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {visao.indicadores.map((indicador) => (
          <StatCard key={indicador.id} label={indicador.label} value={indicador.valor} trend={indicador.tendencia} />
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <Card title="Casos críticos" subtitle="Priorize os prazos mais próximos da semana." eyebrow="Fila prioritária">
          {casos.map((caso) => (
            <article key={caso.id} className="rounded-[1.25rem] border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold text-[var(--color-ink)]">{caso.titulo}</p>
                <StatusBadge label={`Prazo ${formatarData(caso.prazoFinal)}`} variant="alerta" />
              </div>
              <p className="mt-2 text-sm text-[var(--color-muted)]">{caso.cliente}</p>
              <Link href={`/casos/${caso.id}`} className="mt-2 inline-flex text-sm font-semibold text-[var(--color-accent)]">
                Ver detalhe do caso
              </Link>
            </article>
          ))}
        </Card>

        <Card title="Petições em andamento" subtitle="Pedidos em produção no módulo de Petições." eyebrow="Produção">
          {pedidos.map((pedido) => (
            <article key={pedido.id} className="rounded-[1.25rem] border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold text-[var(--color-ink)]">{pedido.id}</p>
                <StatusBadge label={pedido.status} variant="implantacao" />
              </div>
              <p className="mt-2 text-sm text-[var(--color-muted)]">{pedido.titulo}</p>
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

      <Card title="Atividades recentes" subtitle="Rastro rápido das últimas movimentações registradas." eyebrow="Auditoria operacional">
        <div className="space-y-2">
          {visao.atividadesRecentes.map((atividade) => (
            <div key={atividade.id} className="flex items-center justify-between rounded-[1.2rem] border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-4">
              <p className="text-sm font-medium text-[var(--color-ink)]">{atividade.titulo}</p>
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
