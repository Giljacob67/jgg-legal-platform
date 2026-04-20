import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { InlineAlert } from "@/components/ui/inline-alert";
import { StatusBadge } from "@/components/ui/status-badge";
import { ChartIcon, ChevronRightIcon, FileIcon, FolderIcon, SearchIcon, UsersIcon } from "@/components/ui/icons";
import { obterKpis, listarAlcadas, listarAlertas } from "@/modules/gestao/application";
import { COR_URGENCIA } from "@/modules/gestao/domain/types";
import Link from "next/link";

export default async function GestaoPage() {
  const [kpis, alcadas, alertas] = await Promise.all([obterKpis(), listarAlcadas(), listarAlertas()]);

  const kpiCards = [
    { label: "Casos abertos", valor: kpis.casosAbertos, total: kpis.totalCasos, icon: FolderIcon },
    { label: "Pedidos em produção", valor: kpis.pedidosEmProducao, total: kpis.totalPedidos, icon: ChartIcon },
    { label: "Contratos vigentes", valor: kpis.contratosVigentes, total: kpis.totalContratos, icon: FileIcon },
    { label: "Clientes ativos", valor: kpis.clientesAtivos, total: kpis.totalClientes, icon: UsersIcon },
    { label: "Documentos pendentes OCR", valor: kpis.documentosPendentesOCR, total: kpis.totalDocumentos, icon: SearchIcon },
    { label: "Pedidos concluídos", valor: kpis.pedidosConcluidos, total: kpis.totalPedidos, icon: ChartIcon },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestão"
        description="Indicadores operacionais, alçadas da equipe e alertas de produtividade."
        meta={<StatusBadge label={`${alertas.length} alertas ativos`} variant={alertas.length > 0 ? "alerta" : "sucesso"} />}
      />

      {alertas.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-[var(--color-ink)]">Alertas ativos ({alertas.length})</p>
          {alertas.map((a) => (
            <InlineAlert
              key={a.id}
              title={a.titulo}
              variant={a.urgencia === "baixa" ? "info" : "warning"}
              className={COR_URGENCIA[a.urgencia]}
            >
              {a.descricao}
              {a.prazo ? (
                <span className="mt-2 block text-xs font-medium">
                  Prazo: {new Date(a.prazo).toLocaleDateString("pt-BR")}
                </span>
              ) : null}
            </InlineAlert>
          ))}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        {kpiCards.map((k) => (
          <div key={k.label} className="rounded-[1.45rem] border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-[var(--shadow-card)]">
            <div className="flex items-center gap-2">
              <span className="grid h-10 w-10 place-items-center rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] text-[var(--color-accent)]">
                <k.icon size={18} />
              </span>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-muted-strong)]">{k.label}</p>
            </div>
            <div className="mt-2 flex items-end gap-1">
              <p className="font-serif text-4xl text-[var(--color-ink)]">{k.valor}</p>
              <p className="mb-1 text-sm text-[var(--color-muted)]">/ {k.total}</p>
            </div>
            <div className="mt-3 h-2 w-full rounded-full bg-[var(--color-surface-alt)]">
              <div
                className="h-2 rounded-full bg-[var(--color-accent)]"
                style={{ width: k.total > 0 ? `${Math.round((k.valor / k.total) * 100)}%` : "0%" }}
              />
            </div>
          </div>
        ))}
      </div>

      <Card title="Alçada da equipe" subtitle="Distribuição de trabalho ativo por advogado." eyebrow="Capacidade">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-alt)]">
                {["Advogado", "Casos ativos", "Pedidos em produção", "Pedidos concluídos", "Próximo prazo"].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-[var(--color-muted)]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {alcadas.map((adv, i) => (
                <tr key={adv.userId} className={`border-b border-[var(--color-border)] last:border-0 ${i % 2 === 0 ? "" : "bg-[var(--color-surface-alt)]/40"}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-accent)] text-xs font-bold text-white">{adv.iniciais}</div>
                      <span className="font-medium text-[var(--color-ink)]">{adv.nome}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-semibold text-[var(--color-ink)]">{adv.casosAtivos}</td>
                  <td className="px-4 py-3 font-semibold text-amber-700">{adv.pedidosEmProducao}</td>
                  <td className="px-4 py-3 font-semibold text-emerald-700">{adv.pedidosConcluidos}</td>
                  <td className="px-4 py-3 text-xs text-[var(--color-muted)]">
                    {adv.proximoPrazo ? (
                      <span className={new Date(adv.proximoPrazo) < new Date(new Date().getTime() + 7 * 86400000) ? "text-rose-600 font-semibold" : ""}>
                        {new Date(adv.proximoPrazo).toLocaleDateString("pt-BR")}
                      </span>
                    ) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { href: "/casos", label: "Ver todos os casos", icon: FolderIcon },
          { href: "/peticoes", label: "Ver petições em produção", icon: ChartIcon },
          { href: "/contratos", label: "Ver contratos vigentes", icon: FileIcon },
        ].map((l) => (
          <Link key={l.href} href={l.href} className="group flex items-center gap-3 rounded-[1.35rem] border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-4 text-sm font-medium text-[var(--color-muted)] shadow-[var(--shadow-card)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]">
            <span className="grid h-10 w-10 place-items-center rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] text-[var(--color-accent)]">
              <l.icon size={18} />
            </span>
            {l.label}
            <ChevronRightIcon size={16} className="ml-auto" />
          </Link>
        ))}
      </div>
    </div>
  );
}
