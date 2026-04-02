"use client";

import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import type { PainelInteligenciaJuridica } from "@/modules/peticoes/inteligencia-juridica/domain/types";

type PainelInteligenciaJuridicaProps = {
  inteligenciaJuridica: PainelInteligenciaJuridica | null;
};

function badgeDoNivel(nivel: PainelInteligenciaJuridica["score"]["nivel"]): {
  label: string;
  variant: "sucesso" | "alerta" | "neutro";
} {
  if (nivel === "excelente") {
    return { label: "excelente", variant: "sucesso" };
  }

  if (nivel === "bom") {
    return { label: "bom", variant: "sucesso" };
  }

  if (nivel === "regular") {
    return { label: "regular", variant: "alerta" };
  }

  return { label: "crítico", variant: "alerta" };
}

export function PainelInteligenciaJuridicaView({ inteligenciaJuridica }: PainelInteligenciaJuridicaProps) {
  if (!inteligenciaJuridica) {
    return (
      <Card
        title="Inteligência Jurídica"
        subtitle="Análise automática de teses, checklist, alertas e score de qualidade."
      >
        <div className="space-y-3 text-sm text-[var(--color-ink)]">
          <div className="rounded-xl border border-[var(--color-border)] p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">Resumo executivo</p>
            <p className="mt-2 text-sm text-[var(--color-muted)]">
              Inteligência jurídica indisponível no momento. O editor segue utilizável com fallback seguro.
            </p>
            <p className="mt-2 text-xs text-[var(--color-muted)]">
              Prioridade de revisão: média. Recomenda-se confirmar contexto, documentos e fundamentos da peça.
            </p>
          </div>

          <div className="rounded-xl border border-[var(--color-border)] p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">Score de qualidade</p>
              <StatusBadge label="neutro" variant="neutro" />
            </div>
            <p className="mt-2 text-sm text-[var(--color-muted)]">0/100 (indisponível)</p>
          </div>
        </div>
      </Card>
    );
  }

  const scoreBadge = badgeDoNivel(inteligenciaJuridica.score.nivel);

  return (
    <Card title="Inteligência Jurídica" subtitle="Recomendações jurídicas e validações automáticas da minuta.">
      <div className="space-y-3 text-sm text-[var(--color-ink)]">
        <div className="rounded-xl border border-[var(--color-border)] p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">Resumo executivo</p>
          <p className="mt-2">{inteligenciaJuridica.resumoExecutivo.statusGeral}</p>
          <p className="mt-2 text-xs text-[var(--color-muted)]">
            Prioridade de revisão: {inteligenciaJuridica.resumoExecutivo.prioridadeRevisao}
          </p>
          <ul className="mt-2 space-y-1 text-xs text-[var(--color-muted)]">
            {inteligenciaJuridica.resumoExecutivo.principaisPontos.map((ponto) => (
              <li key={ponto}>• {ponto}</li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-[var(--color-border)] p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">Score de qualidade</p>
            <StatusBadge label={scoreBadge.label} variant={scoreBadge.variant} />
          </div>
          <p className="mt-2 text-sm">
            {inteligenciaJuridica.score.total}/100 ({inteligenciaJuridica.score.nivel})
          </p>
          <p className="mt-2 text-xs text-[var(--color-muted)]">
            Obrigatórios {inteligenciaJuridica.score.breakdown.checklistObrigatorio} • Recomendáveis{" "}
            {inteligenciaJuridica.score.breakdown.checklistRecomendavel} • Blocos{" "}
            {inteligenciaJuridica.score.breakdown.blocos} • Referências{" "}
            {inteligenciaJuridica.score.breakdown.referencias} • Coerência{" "}
            {inteligenciaJuridica.score.breakdown.coerencia}
          </p>
        </div>

        <div className="rounded-xl border border-[var(--color-border)] p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">Teses sugeridas</p>
          {inteligenciaJuridica.tesesSugeridas.length === 0 ? (
            <p className="mt-2 text-xs text-[var(--color-muted)]">Nenhuma tese com aderência mínima nesta versão.</p>
          ) : (
            <div className="mt-2 space-y-2">
              {inteligenciaJuridica.tesesSugeridas.map((tese) => (
                <article key={tese.teseId} className="rounded-lg border border-[var(--color-border)] p-2">
                  <p className="text-sm font-semibold text-[var(--color-ink)]">{tese.titulo}</p>
                  <p className="text-xs text-[var(--color-muted)]">Aderência: {tese.scoreAderencia}/100</p>
                  <p className="mt-1 text-xs text-[var(--color-muted)]">{tese.justificativa}</p>
                  {tese.lacunas.length > 0 ? (
                    <p className="mt-1 text-xs text-[var(--color-muted)]">Lacunas: {tese.lacunas.slice(0, 2).join(" • ")}</p>
                  ) : null}
                </article>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-[var(--color-border)] p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">Checklist jurídico</p>
          <p className="mt-2 text-xs text-[var(--color-muted)]">
            Obrigatórios: {Math.round(inteligenciaJuridica.checklist.coberturaObrigatoria * 100)}% • Recomendáveis:{" "}
            {Math.round(inteligenciaJuridica.checklist.coberturaRecomendavel * 100)}%
          </p>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            <div className="rounded-lg border border-[var(--color-border)] p-2">
              <p className="text-xs font-semibold text-[var(--color-ink)]">Obrigatórios</p>
              <ul className="mt-1 space-y-1 text-xs text-[var(--color-muted)]">
                {inteligenciaJuridica.checklist.obrigatorios.map((item) => (
                  <li key={item.itemId}>
                    {item.status === "atendido" ? "✓" : "•"} {item.descricao}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-lg border border-[var(--color-border)] p-2">
              <p className="text-xs font-semibold text-[var(--color-ink)]">Recomendáveis</p>
              <ul className="mt-1 space-y-1 text-xs text-[var(--color-muted)]">
                {inteligenciaJuridica.checklist.recomendaveis.map((item) => (
                  <li key={item.itemId}>
                    {item.status === "atendido" ? "✓" : "•"} {item.descricao}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-[var(--color-border)] p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">Alertas</p>
          {inteligenciaJuridica.alertas.length === 0 ? (
            <p className="mt-2 text-xs text-[var(--color-muted)]">Nenhum alerta crítico ativo.</p>
          ) : (
            <ul className="mt-2 space-y-2 text-xs text-[var(--color-muted)]">
              {inteligenciaJuridica.alertas.map((alerta) => (
                <li key={alerta.codigo} className="rounded-lg border border-[var(--color-border)] p-2">
                  <p className="font-semibold text-[var(--color-ink)]">
                    {alerta.codigo} • {alerta.severidade}
                  </p>
                  <p>{alerta.mensagem}</p>
                  <p className="mt-1">Recomendação: {alerta.recomendacao}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Card>
  );
}
