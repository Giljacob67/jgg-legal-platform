"use client";

import { useMemo, useState } from "react";
import type { EtapaPipeline, EtapaPipelineInfo, HistoricoPipeline } from "@/modules/peticoes/domain/types";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatarDataHora } from "@/lib/utils";

type PipelineWorkspaceProps = {
  etapas: EtapaPipelineInfo[];
  etapaInicial: EtapaPipeline;
  historico: HistoricoPipeline[];
};

function toStatus(
  etapa: EtapaPipelineInfo,
  etapaAtual: EtapaPipeline,
  priorizadas: EtapaPipelineInfo[],
): { label: string; variant: "sucesso" | "alerta" | "neutro" | "implantacao" } {
  if (!etapa.priorizadaMvp) {
    return { label: "mockado", variant: "implantacao" };
  }

  const indiceAtual = priorizadas.findIndex((item) => item.id === etapaAtual);
  const indiceEtapa = priorizadas.findIndex((item) => item.id === etapa.id);

  if (indiceEtapa < indiceAtual) {
    return { label: "concluída", variant: "sucesso" };
  }

  if (indiceEtapa === indiceAtual) {
    return { label: "em andamento", variant: "alerta" };
  }

  return { label: "pendente", variant: "neutro" };
}

export function PipelineWorkspace({ etapas, etapaInicial, historico }: PipelineWorkspaceProps) {
  const etapasPriorizadas = useMemo(() => etapas.filter((etapa) => etapa.priorizadaMvp), [etapas]);

  const etapaInicialValida = etapasPriorizadas.some((etapa) => etapa.id === etapaInicial)
    ? etapaInicial
    : etapasPriorizadas[0]?.id;

  const [etapaAtual, setEtapaAtual] = useState<EtapaPipeline | undefined>(etapaInicialValida);

  const indiceAtual = etapasPriorizadas.findIndex((etapa) => etapa.id === etapaAtual);

  function avancarEtapa() {
    if (indiceAtual < 0 || indiceAtual >= etapasPriorizadas.length - 1) {
      return;
    }

    setEtapaAtual(etapasPriorizadas[indiceAtual + 1].id);
  }

  function voltarEtapa() {
    if (indiceAtual <= 0) {
      return;
    }

    setEtapaAtual(etapasPriorizadas[indiceAtual - 1].id);
  }

  return (
    <div className="space-y-6">
      <Card title="Pipeline de produção" subtitle="10 etapas visuais, com operação funcional priorizada em 6 etapas do MVP.">
        <div className="mb-4 flex flex-wrap gap-2">
          <button
            onClick={voltarEtapa}
            disabled={indiceAtual <= 0}
            className="rounded-xl border border-[var(--color-border)] px-3 py-1.5 text-sm font-medium text-[var(--color-ink)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Voltar etapa funcional
          </button>
          <button
            onClick={avancarEtapa}
            disabled={indiceAtual < 0 || indiceAtual >= etapasPriorizadas.length - 1}
            className="rounded-xl bg-[var(--color-accent)] px-3 py-1.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            Avançar etapa funcional
          </button>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {etapas.map((etapa, index) => {
            const status = etapaAtual ? toStatus(etapa, etapaAtual, etapasPriorizadas) : { label: "pendente", variant: "neutro" as const };
            return (
              <article key={etapa.id} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-[var(--color-ink)]">
                    {index + 1}. {etapa.nome}
                  </p>
                  <StatusBadge label={status.label} variant={status.variant} />
                </div>
                <p className="mt-2 text-xs text-[var(--color-muted)]">
                  {etapa.priorizadaMvp
                    ? "Etapa funcional nesta versão do MVP."
                    : "Etapa visível e tipada para evolução posterior."}
                </p>
              </article>
            );
          })}
        </div>
      </Card>

      <Card title="Histórico e auditoria" subtitle="Rastros mockados por etapa já executada.">
        <div className="space-y-3">
          {historico.map((item) => (
            <article key={item.id} className="rounded-xl border border-[var(--color-border)] bg-white p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold text-[var(--color-ink)]">{item.descricao}</p>
                <p className="text-xs text-[var(--color-muted)]">{formatarDataHora(item.data)}</p>
              </div>
              <p className="mt-1 text-xs text-[var(--color-muted)]">Etapa: {item.etapa.replaceAll("_", " ")}</p>
              <p className="text-xs text-[var(--color-muted)]">Responsável: {item.responsavel}</p>
            </article>
          ))}
        </div>
      </Card>
    </div>
  );
}
