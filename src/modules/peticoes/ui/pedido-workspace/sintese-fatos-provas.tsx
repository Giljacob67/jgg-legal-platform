"use client";

import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { InlineAlert } from "@/components/ui/inline-alert";
import { calcularSinteseFatosProvas } from "@/modules/peticoes/domain/fatos-provas";
import type { ItemMatrizFatoProva } from "@/modules/peticoes/domain/fatos-provas";

type SinteseFatosProvasProps = {
  itens: ItemMatrizFatoProva[] | undefined | null;
};

function nivelVariant(nivel: string): "sucesso" | "implantacao" | "alerta" | "neutro" {
  if (nivel === "alto") return "sucesso";
  if (nivel === "medio") return "implantacao";
  if (nivel === "baixo") return "alerta";
  return "neutro";
}

export function SinteseFatosProvas({ itens }: SinteseFatosProvasProps) {
  const sintese = calcularSinteseFatosProvas(itens);

  return (
    <Card
      title="Síntese da base factual"
      subtitle="Panorama quantitativo e qualitativo dos fatos mapeados antes da estruturação de teses."
      eyebrow="Análise"
    >
      <div className="grid gap-3 md:grid-cols-5">
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-muted-strong)]">Total de fatos</p>
          <p className="font-serif text-3xl text-[var(--color-ink)]">{sintese.totalFatos}</p>
        </div>

        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-muted-strong)]">Comprovados</p>
          <p className="font-serif text-3xl text-[var(--color-ink)]">{sintese.fatosComprovados}</p>
        </div>

        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-muted-strong)]">Controvertidos</p>
          <p className="font-serif text-3xl text-[var(--color-ink)]">{sintese.fatosControvertidos}</p>
        </div>

        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-muted-strong)]">Lacunas</p>
          <p className="font-serif text-3xl text-[var(--color-ink)]">{sintese.lacunasProbatarias}</p>
        </div>

        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-muted-strong)]">Segurança factual</p>
          <div className="mt-1">
            <StatusBadge
              label={sintese.nivelSegurancaFactual === "indefinido" ? "indefinido" : sintese.nivelSegurancaFactual}
              variant={nivelVariant(sintese.nivelSegurancaFactual)}
            />
          </div>
        </div>
      </div>

      <InlineAlert
        title={`Nível de segurança: ${sintese.nivelSegurancaFactual}`}
        variant={
          sintese.nivelSegurancaFactual === "alto"
            ? "success"
            : sintese.nivelSegurancaFactual === "baixo"
              ? "warning"
              : "info"
        }
      >
        {sintese.justificativaNivel}
      </InlineAlert>
    </Card>
  );
}
