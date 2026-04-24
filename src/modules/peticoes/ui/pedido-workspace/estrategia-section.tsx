"use client";

import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { InlineAlert } from "@/components/ui/inline-alert";
import { SparkIcon } from "@/components/ui/icons";
import type { PedidoWorkspaceData } from "./types";

type EstrategiaSectionProps = Pick<PedidoWorkspaceData, "dossie">;

export function EstrategiaSection({ dossie }: EstrategiaSectionProps) {
  const diagnostico = dossie?.diagnosticoEstrategico;
  const estrategiaAprovada = dossie?.estrategiaAprovada;

  return (
    <div className="space-y-6">
      <Card
        title="Diagnóstico estratégico"
        subtitle="Diretriz principal, alavancas, fragilidades e decisões de estratégia consolidadas."
        eyebrow="Estratégia"
      >
        {!diagnostico ? (
          <EmptyState
            title="Diagnóstico não consolidado"
            message="Execute o estágio de estratégia jurídica no pipeline para gerar o diagnóstico e as teses candidatas."
            icon={<SparkIcon size={22} />}
          />
        ) : (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <StatusBadge
                  label={estrategiaAprovada?.liberadaParaEstruturacao ? "Estratégia liberada" : "Aguardando aprovação"}
                  variant={estrategiaAprovada?.liberadaParaEstruturacao ? "sucesso" : "implantacao"}
                />
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-4">
              <p className="text-sm font-semibold text-[var(--color-ink)]">Resumo executivo da estratégia</p>
              <p className="mt-2 text-sm text-[var(--color-muted)]">{diagnostico.resumo}</p>
            </div>

            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-4">
              <p className="text-sm font-semibold text-[var(--color-ink)]">Diretriz principal</p>
              <p className="mt-2 text-sm text-[var(--color-muted)]">{diagnostico.diretrizPrincipal}</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-4">
                <p className="text-sm font-semibold text-[var(--color-ink)]">Alavancas</p>
                {diagnostico.alavancas.length > 0 ? (
                  <ul className="mt-3 space-y-1 text-sm text-[var(--color-muted)]">
                    {diagnostico.alavancas.map((a) => (
                      <li key={a}>• {a}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm text-[var(--color-muted)]">Nenhuma alavanca mapeada.</p>
                )}
              </div>

              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-4">
                <p className="text-sm font-semibold text-[var(--color-ink)]">Fragilidades</p>
                {diagnostico.fragilidades.length > 0 ? (
                  <ul className="mt-3 space-y-1 text-sm text-[var(--color-muted)]">
                    {diagnostico.fragilidades.map((f) => (
                      <li key={f}>• {f}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm text-[var(--color-muted)]">Nenhuma fragilidade mapeada.</p>
                )}
              </div>
            </div>

            {diagnostico.pendencias.length > 0 ? (
              <div className="space-y-2">
                <p className="text-sm font-semibold text-[var(--color-ink)]">Pendências estratégicas</p>
                {diagnostico.pendencias.map((p) => (
                  <InlineAlert key={p} title="Pendência" variant="warning">{p}</InlineAlert>
                ))}
              </div>
            ) : null}

            {diagnostico.pontosAEvitar && diagnostico.pontosAEvitar.length > 0 ? (
              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-4">
                <p className="text-sm font-semibold text-[var(--color-ink)]">Pontos a evitar</p>
                <ul className="mt-3 space-y-1 text-sm text-[var(--color-muted)]">
                  {diagnostico.pontosAEvitar.map((p) => (
                    <li key={p}>• {p}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            {diagnostico.pedidosRecomendados && diagnostico.pedidosRecomendados.length > 0 ? (
              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-4">
                <p className="text-sm font-semibold text-[var(--color-ink)]">Pedidos recomendados</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {diagnostico.pedidosRecomendados.map((p) => (
                    <span
                      key={p}
                      className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-3 py-1 text-xs text-[var(--color-muted)]"
                    >
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        )}
      </Card>
    </div>
  );
}
