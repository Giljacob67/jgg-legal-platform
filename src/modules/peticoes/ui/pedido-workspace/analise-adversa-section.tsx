"use client";

import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { InlineAlert } from "@/components/ui/inline-alert";
import { ShieldCheckIcon } from "@/components/ui/icons";
import type { PedidoWorkspaceData } from "./types";

type AnaliseAdversaSectionProps = Pick<PedidoWorkspaceData, "dossie">;

export function AnaliseAdversaSection({ dossie }: AnaliseAdversaSectionProps) {
  const analise = dossie?.analiseAdversa;

  return (
    <div className="space-y-6">
      <Card
        title="Análise adversa"
        subtitle="Antecipação dos ataques da parte contrária, vulnerabilidades e riscos processuais."
        eyebrow="Risco"
      >
        {!analise ? (
          <EmptyState
            title="Análise adversa não disponível"
            message="Execute o estágio de análise adversa no pipeline para gerar o mapa de riscos e vulnerabilidades."
            icon={<ShieldCheckIcon size={22} />}
          />
        ) : (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-[var(--color-muted)]">Nível de risco geral para o cliente:</p>
              <StatusBadge
                label={analise.nivelRiscoGeral}
                variant={
                  analise.nivelRiscoGeral === "alto"
                    ? "alerta"
                    : analise.nivelRiscoGeral === "medio"
                      ? "implantacao"
                      : "sucesso"
                }
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-4">
                <p className="text-sm font-semibold text-[var(--color-ink)]">Pontos fortes</p>
                {analise.pontosFortes.length > 0 ? (
                  <ul className="mt-3 space-y-1 text-sm text-[var(--color-muted)]">
                    {analise.pontosFortes.map((p) => (
                      <li key={p}>• {p}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm text-[var(--color-muted)]">Nenhum ponto forte mapeado.</p>
                )}
              </div>

              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-4">
                <p className="text-sm font-semibold text-[var(--color-ink)]">Vulnerabilidades</p>
                {analise.vulnerabilidades.length > 0 ? (
                  <ul className="mt-3 space-y-1 text-sm text-[var(--color-muted)]">
                    {analise.vulnerabilidades.map((p) => (
                      <li key={p}>• {p}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm text-[var(--color-muted)]">Nenhuma vulnerabilidade mapeada.</p>
                )}
              </div>

              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-4">
                <p className="text-sm font-semibold text-[var(--color-ink)]">Argumentos adversos previstos</p>
                {analise.argumentosAdversos.length > 0 ? (
                  <ul className="mt-3 space-y-1 text-sm text-[var(--color-muted)]">
                    {analise.argumentosAdversos.map((p) => (
                      <li key={p}>• {p}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm text-[var(--color-muted)]">Nenhum argumento adverso mapeado.</p>
                )}
              </div>

              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-4">
                <p className="text-sm font-semibold text-[var(--color-ink)]">Riscos processuais</p>
                {analise.riscosProcessuais.length > 0 ? (
                  <ul className="mt-3 space-y-1 text-sm text-[var(--color-muted)]">
                    {analise.riscosProcessuais.map((p) => (
                      <li key={p}>• {p}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm text-[var(--color-muted)]">Nenhum risco processual mapeado.</p>
                )}
              </div>
            </div>

            {analise.observacoes ? (
              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-4">
                <p className="text-sm font-semibold text-[var(--color-ink)]">Observações</p>
                <p className="mt-2 text-sm text-[var(--color-muted)]">{analise.observacoes}</p>
              </div>
            ) : null}

            {analise.recomendacoesCautela && analise.recomendacoesCautela.length > 0 ? (
              <div className="space-y-2">
                <p className="text-sm font-semibold text-[var(--color-ink)]">Recomendações de cautela</p>
                {analise.recomendacoesCautela.map((rec) => (
                  <InlineAlert key={rec} title="Cautela" variant="warning">{rec}</InlineAlert>
                ))}
              </div>
            ) : null}
          </div>
        )}
      </Card>
    </div>
  );
}
