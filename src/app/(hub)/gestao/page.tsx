import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { obterKpis, listarAlcadas, listarAlertas } from "@/modules/gestao/application";
import { COR_URGENCIA } from "@/modules/gestao/domain/types";
import Link from "next/link";

export default async function GestaoPage() {
  const [kpis, alcadas, alertas] = await Promise.all([obterKpis(), listarAlcadas(), listarAlertas()]);

  const kpiCards = [
    { label: "Casos abertos", valor: kpis.casosAbertos, total: kpis.totalCasos, emoji: "⚖️" },
    { label: "Pedidos em produção", valor: kpis.pedidosEmProducao, total: kpis.totalPedidos, emoji: "📝" },
    { label: "Contratos vigentes", valor: kpis.contratosVigentes, total: kpis.totalContratos, emoji: "📄" },
    { label: "Clientes ativos", valor: kpis.clientesAtivos, total: kpis.totalClientes, emoji: "👥" },
    { label: "Documentos pendentes OCR", valor: kpis.documentosPendentesOCR, total: kpis.totalDocumentos, emoji: "🔍" },
    { label: "Pedidos concluídos", valor: kpis.pedidosConcluidos, total: kpis.totalPedidos, emoji: "✅" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Gestão" description="Indicadores operacionais, alçadas da equipe e alertas de produtividade." />

      {/* Alertas */}
      {alertas.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-[var(--color-ink)]">🔔 Alertas ativos ({alertas.length})</p>
          {alertas.map((a) => (
            <div key={a.id} className={`flex items-start gap-3 rounded-xl border px-4 py-3 ${COR_URGENCIA[a.urgencia]}`}>
              <span className="text-lg">{a.urgencia === "critica" ? "🚨" : a.urgencia === "alta" ? "⚠️" : a.urgencia === "media" ? "🔔" : "ℹ️"}</span>
              <div className="min-w-0">
                <p className="text-sm font-semibold">{a.titulo}</p>
                <p className="text-xs opacity-80">{a.descricao}</p>
              </div>
              {a.prazo && (
                <span className="ml-auto text-xs font-mono opacity-70 whitespace-nowrap">
                  {new Date(a.prazo).toLocaleDateString("pt-BR")}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* KPIs */}
      <div className="grid gap-3 sm:grid-cols-3">
        {kpiCards.map((k) => (
          <div key={k.label} className="rounded-xl border border-[var(--color-border)] bg-white p-4">
            <div className="flex items-center gap-2">
              <span className="text-xl">{k.emoji}</span>
              <p className="text-xs font-semibold text-[var(--color-muted)]">{k.label}</p>
            </div>
            <div className="mt-2 flex items-end gap-1">
              <p className="text-2xl font-bold text-[var(--color-ink)]">{k.valor}</p>
              <p className="text-sm text-[var(--color-muted)] mb-0.5">/ {k.total}</p>
            </div>
            <div className="mt-2 h-1.5 w-full rounded-full bg-[var(--color-surface-alt)]">
              <div
                className="h-1.5 rounded-full bg-[var(--color-accent)]"
                style={{ width: k.total > 0 ? `${Math.round((k.valor / k.total) * 100)}%` : "0%" }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Alçada por advogado */}
      <Card title="Alçada da equipe" subtitle="Distribuição de trabalho ativo por advogado.">
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
                      <span className={new Date(adv.proximoPrazo) < new Date(Date.now() + 7 * 86400000) ? "text-rose-600 font-semibold" : ""}>
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

      {/* Links rápidos */}
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { href: "/casos", label: "Ver todos os casos", emoji: "⚖️" },
          { href: "/peticoes", label: "Ver petições em produção", emoji: "📝" },
          { href: "/contratos", label: "Ver contratos vigentes", emoji: "📄" },
        ].map((l) => (
          <Link key={l.href} href={l.href} className="group flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm font-medium text-[var(--color-muted)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]">
            <span>{l.emoji}</span>{l.label}<span className="ml-auto">→</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
