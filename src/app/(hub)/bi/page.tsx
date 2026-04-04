import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { obterMetricasFinanceiras, obterMetricasJuridicas, obterInsightsIA } from "@/modules/bi/application";
import { COR_INSIGHT } from "@/modules/bi/domain/types";

function formatarValor(centavos: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(centavos / 100);
}

function BarraHorizontal({ label, count, max }: { label: string; count: number; max: number }) {
  const pct = max > 0 ? Math.round((count / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="w-36 truncate text-xs text-[var(--color-muted)]">{label}</span>
      <div className="flex-1 h-2 rounded-full bg-[var(--color-surface-alt)]">
        <div className="h-2 rounded-full bg-[var(--color-accent)] transition-all" style={{ width: `${pct}%` }} />
      </div>
      <span className="w-6 text-right text-xs font-semibold text-[var(--color-ink)]">{count}</span>
    </div>
  );
}

export default async function BIPage() {
  const [financeiro, juridico, insights] = await Promise.all([
    obterMetricasFinanceiras(),
    obterMetricasJuridicas(),
    obterInsightsIA(),
  ]);

  const maxMes = Math.max(...financeiro.receitaPorMes.map((m) => m.valor), 1);
  const maxMateria = Math.max(...juridico.casosPorMateria.map((m) => m.count), 1);
  const maxPedido = Math.max(...juridico.pedidosPorTipo.map((p) => p.count), 1);

  const EMOJI_INSIGHT: Record<string, string> = {
    oportunidade: "🌟", risco: "⚠️", tendencia: "📈", recomendacao: "💡",
  };

  return (
    <div className="space-y-6">
      <PageHeader title="BI" description="Métricas estratégicas e inteligência de dados para tomada de decisão." />

      {/* Financeiro KPIs */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="col-span-1 sm:col-span-2 rounded-xl border border-[var(--color-border)] bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">Receita total de contratos</p>
          <p className="mt-1 text-3xl font-bold text-[var(--color-ink)]">{formatarValor(financeiro.receitaTotal)}</p>
          <p className="text-xs text-[var(--color-muted)]">Ticket médio: {formatarValor(financeiro.ticketMedioContrato)}</p>
        </div>
        <div className="rounded-xl border border-[var(--color-border)] bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">Tempo médio de conclusão</p>
          <p className="mt-1 text-3xl font-bold text-[var(--color-ink)]">{juridico.tempoMedioConclusaoDias}</p>
          <p className="text-xs text-[var(--color-muted)]">dias por pedido</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Receita por mês */}
        <Card title="Receita mensal de contratos" subtitle="Últimos 6 meses">
          <div className="space-y-2.5">
            {financeiro.receitaPorMes.map((m) => (
              <div key={m.mes} className="flex items-center gap-3 text-sm">
                <span className="w-14 text-xs text-[var(--color-muted)]">{m.mes}</span>
                <div className="flex-1 h-5 rounded-lg bg-[var(--color-surface-alt)] overflow-hidden">
                  <div
                    className="h-5 rounded-lg bg-gradient-to-r from-violet-500 to-violet-400 transition-all"
                    style={{ width: maxMes > 0 ? `${Math.round((m.valor / maxMes) * 100)}%` : "0%" }}
                  />
                </div>
                <span className="w-24 text-right text-xs font-semibold text-[var(--color-ink)]">{formatarValor(m.valor)}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Cases por matéria */}
        <Card title="Casos por matéria" subtitle="Distribuição da carteira atual">
          <div className="space-y-2.5">
            {juridico.casosPorMateria.map((m) => (
              <BarraHorizontal key={m.materia} label={m.materia} count={m.count} max={maxMateria} />
            ))}
          </div>
          <div className="mt-4 border-t border-[var(--color-border)] pt-4 space-y-2.5">
            <p className="text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wide">Pedidos por tipo de peça</p>
            {juridico.pedidosPorTipo.map((p) => (
              <BarraHorizontal key={p.tipo} label={p.tipo} count={p.count} max={maxPedido} />
            ))}
          </div>
        </Card>
      </div>

      {/* Insights IA */}
      <Card title="🤖 Insights estratégicos" subtitle="Análise automática do panorama do escritório.">
        <div className="grid gap-3 sm:grid-cols-2">
          {insights.map((ins, i) => (
            <div key={i} className={`rounded-xl border p-4 ${COR_INSIGHT[ins.tipo]}`}>
              <div className="flex items-start gap-2">
                <span className="text-lg">{EMOJI_INSIGHT[ins.tipo]}</span>
                <div>
                  <p className="font-semibold text-sm">{ins.titulo}</p>
                  <p className="mt-1 text-xs opacity-90 leading-relaxed">{ins.descricao}</p>
                  <span className={`mt-2 inline-block rounded-full px-2 py-0.5 text-xs font-semibold border ${
                    ins.prioridade === "alta" ? "bg-rose-100 text-rose-700 border-rose-200" : "bg-gray-100 text-gray-600 border-gray-200"
                  }`}>
                    {ins.prioridade === "alta" ? "Prioridade alta" : "Prioridade média"}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-[var(--color-muted)]">
          Insights gerados em {new Date(insights[0]?.geradoEm ?? new Date().toISOString()).toLocaleString("pt-BR")}
        </p>
      </Card>
    </div>
  );
}
