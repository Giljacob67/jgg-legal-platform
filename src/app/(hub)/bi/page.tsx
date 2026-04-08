import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import {
  obterMetricasFinanceiras,
  obterMetricasJuridicas,
  obterInsightsIA,
  obterObservabilidadePipeline,
} from "@/modules/bi/application";
import { COR_INSIGHT } from "@/modules/bi/domain/types";

function formatarValor(centavos: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(centavos / 100);
}

function formatarMs(ms: number) {
  if (!Number.isFinite(ms) || ms <= 0) return "0 ms";
  if (ms >= 1000) return `${(ms / 1000).toFixed(1)} s`;
  return `${Math.round(ms)} ms`;
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
  const [financeiro, juridico, insights, observabilidade] = await Promise.all([
    obterMetricasFinanceiras(),
    obterMetricasJuridicas(),
    obterInsightsIA(),
    obterObservabilidadePipeline(),
  ]);

  const maxMes = Math.max(...financeiro.receitaPorMes.map((m) => m.valor), 1);
  const maxMateria = Math.max(...juridico.casosPorMateria.map((m) => m.count), 1);
  const maxPedido = Math.max(...juridico.pedidosPorTipo.map((p) => p.count), 1);
  const estagioCritico =
    observabilidade.porEstagio.length > 0
      ? [...observabilidade.porEstagio].sort((a, b) =>
        b.taxaFalhaPct - a.taxaFalhaPct || b.latenciaP95Ms - a.latenciaP95Ms)[0]
      : null;

  const EMOJI_INSIGHT: Record<string, string> = {
    oportunidade: "🌟", risco: "⚠️", tendencia: "📈", recomendacao: "💡",
  };

  return (
    <div className="space-y-6">
      <PageHeader title="BI" description="Métricas estratégicas e inteligência de dados para tomada de decisão." />

      {/* Financeiro KPIs */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="col-span-1 sm:col-span-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">Receita total de contratos</p>
          <p className="mt-1 text-3xl font-bold text-[var(--color-ink)]">{formatarValor(financeiro.receitaTotal)}</p>
          <p className="text-xs text-[var(--color-muted)]">Ticket médio: {formatarValor(financeiro.ticketMedioContrato)}</p>
        </div>
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-5">
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

      <Card
        title="Observabilidade do Pipeline IA"
        subtitle={`Janela de ${observabilidade.janelaHoras}h • erro e latência por estágio`}
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-3">
            <p className="text-xs uppercase tracking-wide text-[var(--color-muted)]">Execuções</p>
            <p className="mt-1 text-2xl font-bold text-[var(--color-ink)]">{observabilidade.totalExecucoes}</p>
          </div>
          <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-3">
            <p className="text-xs uppercase tracking-wide text-[var(--color-muted)]">Taxa de falha</p>
            <p className="mt-1 text-2xl font-bold text-[var(--color-ink)]">{observabilidade.taxaFalhaPct}%</p>
            <p className="text-xs text-[var(--color-muted)]">{observabilidade.totalFalhas} falhas</p>
          </div>
          <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-3">
            <p className="text-xs uppercase tracking-wide text-[var(--color-muted)]">Latência média</p>
            <p className="mt-1 text-2xl font-bold text-[var(--color-ink)]">{formatarMs(observabilidade.latenciaMediaMs)}</p>
          </div>
          <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-3">
            <p className="text-xs uppercase tracking-wide text-[var(--color-muted)]">P95</p>
            <p className="mt-1 text-2xl font-bold text-[var(--color-ink)]">{formatarMs(observabilidade.latenciaP95Ms)}</p>
          </div>
        </div>

        {estagioCritico ? (
          <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm">
            <p className="font-semibold text-amber-800">Estágio mais crítico: {estagioCritico.estagio}</p>
            <p className="text-amber-700">
              Falha {estagioCritico.taxaFalhaPct}% • P95 {formatarMs(estagioCritico.latenciaP95Ms)} • Execuções {estagioCritico.totalExecucoes}
            </p>
          </div>
        ) : null}

        <div className="mt-4 overflow-x-auto rounded-xl border border-[var(--color-border)]">
          <table className="w-full min-w-[740px] text-sm">
            <thead className="bg-[var(--color-surface-alt)] text-xs uppercase tracking-wide text-[var(--color-muted)]">
              <tr>
                <th className="px-3 py-2 text-left">Estágio</th>
                <th className="px-3 py-2 text-right">Execuções</th>
                <th className="px-3 py-2 text-right">Falha %</th>
                <th className="px-3 py-2 text-right">Lat. média</th>
                <th className="px-3 py-2 text-right">P95</th>
                <th className="px-3 py-2 text-right">Schema inv. %</th>
                <th className="px-3 py-2 text-right">RAG degr. %</th>
              </tr>
            </thead>
            <tbody>
              {observabilidade.porEstagio.length === 0 ? (
                <tr>
                  <td className="px-3 py-4 text-center text-sm text-[var(--color-muted)]" colSpan={7}>
                    Sem dados de execução no período.
                  </td>
                </tr>
              ) : (
                observabilidade.porEstagio.map((item) => (
                  <tr key={item.estagio} className="border-t border-[var(--color-border)]">
                    <td className="px-3 py-2 font-medium text-[var(--color-ink)]">{item.estagio}</td>
                    <td className="px-3 py-2 text-right text-[var(--color-ink)]">{item.totalExecucoes}</td>
                    <td className={`px-3 py-2 text-right font-semibold ${
                      item.taxaFalhaPct >= 20 ? "text-rose-700" : item.taxaFalhaPct >= 10 ? "text-amber-700" : "text-emerald-700"
                    }`}>{item.taxaFalhaPct}%</td>
                    <td className="px-3 py-2 text-right text-[var(--color-ink)]">{formatarMs(item.latenciaMediaMs)}</td>
                    <td className={`px-3 py-2 text-right ${
                      item.latenciaP95Ms >= 12000 ? "font-semibold text-rose-700" : "text-[var(--color-ink)]"
                    }`}>{formatarMs(item.latenciaP95Ms)}</td>
                    <td className="px-3 py-2 text-right text-[var(--color-ink)]">{item.schemaInvalidoPct}%</td>
                    <td className="px-3 py-2 text-right text-[var(--color-ink)]">{item.ragDegradadoPct}%</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
            <p className="text-xs uppercase tracking-wide text-[var(--color-muted)]">Qualidade de saída</p>
            <p className="mt-1 text-sm text-[var(--color-ink)]">
              Schema inválido: <span className="font-semibold">{observabilidade.schemaInvalidoPct}%</span>
            </p>
            <p className="text-sm text-[var(--color-ink)]">
              RAG degradado: <span className="font-semibold">{observabilidade.ragDegradadoPct}%</span>
            </p>
          </div>
          <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
            <p className="text-xs uppercase tracking-wide text-[var(--color-muted)]">Principais erros</p>
            {observabilidade.principaisErros.length === 0 ? (
              <p className="mt-1 text-sm text-[var(--color-muted)]">Sem erros registrados na janela.</p>
            ) : (
              <ul className="mt-1 space-y-1 text-sm text-[var(--color-ink)]">
                {observabilidade.principaisErros.map((erro) => (
                  <li key={erro.erro} className="flex items-start justify-between gap-2">
                    <span className="line-clamp-1">{erro.erro}</span>
                    <span className="rounded-full bg-[var(--color-surface-alt)] px-2 py-0.5 text-xs font-semibold">
                      {erro.count}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <p className="mt-3 text-xs text-[var(--color-muted)]">
          Métricas atualizadas em {new Date(observabilidade.geradoEm).toLocaleString("pt-BR")}
        </p>
      </Card>
    </div>
  );
}
