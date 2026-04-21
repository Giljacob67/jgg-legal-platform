import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import type { ResumoGovernancaResponsaveis } from "@/modules/peticoes/application/listarAlertasGovernancaPorResponsavel";

type GovernancaResponsaveisBoardProps = {
  resumo: ResumoGovernancaResponsaveis;
};

export function GovernancaResponsaveisBoard({ resumo }: GovernancaResponsaveisBoardProps) {
  return (
    <Card
      title="Governança por responsável"
      subtitle="Visão de coordenação com alertas ativos, SLA estourado e distribuição de risco operacional."
      eyebrow="Coordenação"
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-muted-strong)]">Pedidos</p>
          <p className="font-serif text-3xl text-[var(--color-ink)]">{resumo.totalPedidos}</p>
        </div>
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-muted-strong)]">Responsáveis</p>
          <p className="font-serif text-3xl text-[var(--color-ink)]">{resumo.totalResponsaveis}</p>
        </div>
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-muted-strong)]">Alertas alta</p>
          <p className="font-serif text-3xl text-[var(--color-ink)]">{resumo.totalAlertasAlta}</p>
        </div>
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-muted-strong)]">Alertas média</p>
          <p className="font-serif text-3xl text-[var(--color-ink)]">{resumo.totalAlertasMedia}</p>
        </div>
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-muted-strong)]">SLA estourado</p>
          <p className="font-serif text-3xl text-[var(--color-ink)]">{resumo.totalSlaEstourado}</p>
        </div>
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-muted-strong)]">Alertas totais</p>
          <p className="font-serif text-3xl text-[var(--color-ink)]">{resumo.totalAlertas}</p>
        </div>
      </div>

      <div className="mt-5 overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-y-2">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-[0.16em] text-[var(--color-muted-strong)]">
              <th className="px-3 py-1">Responsável</th>
              <th className="px-3 py-1">Pedidos</th>
              <th className="px-3 py-1">Com alerta</th>
              <th className="px-3 py-1">Alta</th>
              <th className="px-3 py-1">Média</th>
              <th className="px-3 py-1">SLA estourado</th>
            </tr>
          </thead>
          <tbody>
            {resumo.linhas.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-4 text-sm text-[var(--color-muted)]">
                  Nenhum dado de governança encontrado.
                </td>
              </tr>
            ) : (
              resumo.linhas.map((linha) => (
                <tr key={linha.responsavel} className="rounded-xl bg-[var(--color-surface-alt)]">
                  <td className="px-3 py-3 text-sm font-semibold text-[var(--color-ink)]">{linha.responsavel}</td>
                  <td className="px-3 py-3 text-sm text-[var(--color-ink)]">{linha.totalPedidos}</td>
                  <td className="px-3 py-3 text-sm text-[var(--color-ink)]">{linha.pedidosComAlerta}</td>
                  <td className="px-3 py-3 text-sm">
                    <StatusBadge
                      label={`${linha.alertasAlta}`}
                      variant={linha.alertasAlta > 0 ? "alerta" : "sucesso"}
                    />
                  </td>
                  <td className="px-3 py-3 text-sm">
                    <StatusBadge
                      label={`${linha.alertasMedia}`}
                      variant={linha.alertasMedia > 0 ? "implantacao" : "neutro"}
                    />
                  </td>
                  <td className="px-3 py-3 text-sm">
                    <StatusBadge
                      label={`${linha.slaEstourado}`}
                      variant={linha.slaEstourado > 0 ? "alerta" : "sucesso"}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
