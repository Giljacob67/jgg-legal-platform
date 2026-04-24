import { Card } from "@/components/ui/card";
import { InlineAlert } from "@/components/ui/inline-alert";
import { StatusBadge } from "@/components/ui/status-badge";
import type { ContextoJuridicoPedido } from "@/modules/peticoes/domain/types";

type EstruturaPecaPanelProps = {
  contextoAtual: ContextoJuridicoPedido | null;
  compact?: boolean;
};

export function EstruturaPecaPanel({
  contextoAtual,
  compact = false,
}: EstruturaPecaPanelProps) {
  const dossie = contextoAtual?.dossieJuridico;
  const estrutura = dossie?.estruturaDaPeca;
  const liberada = dossie?.estrategiaAprovada.liberadaParaEstruturacao ?? false;

  return (
    <Card
      title="Estrutura da peça"
      subtitle="Camada intermediária entre estratégia aprovada e redação da minuta."
      eyebrow="Estruturação"
    >
      {!contextoAtual || !dossie || !estrutura ? (
        <p className="text-sm text-[var(--color-muted)]">
          A estrutura da peça ainda não foi consolidada para este pedido.
        </p>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-[var(--color-muted)]">
              A minuta deve nascer desta organização de seções, pedidos e provas prioritárias.
            </p>
            <StatusBadge
              label={liberada ? "liberada para redação" : "aguardando estratégia aprovada"}
              variant={liberada ? "sucesso" : "alerta"}
            />
          </div>

          {!liberada ? (
            <InlineAlert title="Estrutura ainda bloqueada" variant="warning">
              A estrutura já pode ser lida, mas a redação final só deve avançar quando a estratégia estiver validada
              humanamente e sem pendências críticas.
            </InlineAlert>
          ) : null}

          <div className="grid gap-4 xl:grid-cols-[1.15fr,0.85fr]">
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-4">
              <p className="text-sm font-semibold text-[var(--color-ink)]">Sequência sugerida da peça</p>
              {estrutura.secoesSugeridas.length === 0 ? (
                <p className="mt-3 text-sm text-[var(--color-muted)]">
                  Nenhuma seção sugerida foi consolidada até o momento.
                </p>
              ) : (
                <ol className="mt-3 space-y-2 text-sm text-[var(--color-muted)]">
                  {estrutura.secoesSugeridas.slice(0, compact ? 4 : 8).map((secao, index) => (
                    <li
                      key={secao}
                      className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-3 py-2"
                    >
                      <span className="font-semibold text-[var(--color-ink)]">{index + 1}.</span> {secao}
                    </li>
                  ))}
                </ol>
              )}
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-4">
                <p className="text-sm font-semibold text-[var(--color-ink)]">Pedidos prioritários</p>
                {estrutura.pedidosPrioritarios.length === 0 ? (
                  <p className="mt-3 text-sm text-[var(--color-muted)]">
                    Nenhum pedido prioritário foi consolidado nesta versão.
                  </p>
                ) : (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {estrutura.pedidosPrioritarios.slice(0, compact ? 3 : 6).map((item) => (
                      <span
                        key={item}
                        className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-3 py-1 text-xs text-[var(--color-muted)]"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-4">
                <p className="text-sm font-semibold text-[var(--color-ink)]">Provas prioritárias</p>
                {estrutura.provasPrioritarias.length === 0 ? (
                  <p className="mt-3 text-sm text-[var(--color-muted)]">
                    A estrutura ainda não apontou provas prioritárias para a redação.
                  </p>
                ) : (
                  <ul className="mt-3 space-y-1 text-sm text-[var(--color-muted)]">
                    {estrutura.provasPrioritarias.slice(0, compact ? 3 : 5).map((item) => (
                      <li key={item}>• {item}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-4">
            <p className="text-sm font-semibold text-[var(--color-ink)]">Observações de redação</p>
            {estrutura.observacoesDeRedacao.length === 0 ? (
              <p className="mt-3 text-sm text-[var(--color-muted)]">
                Ainda não há observações de redação consolidadas.
              </p>
            ) : (
              <ul className="mt-3 space-y-2 text-sm text-[var(--color-muted)]">
                {estrutura.observacoesDeRedacao.slice(0, compact ? 3 : 6).map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}
