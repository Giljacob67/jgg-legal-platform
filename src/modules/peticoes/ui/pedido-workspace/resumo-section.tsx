"use client";

import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { InlineAlert } from "@/components/ui/inline-alert";
import { ButtonLink } from "@/components/ui/button-link";
import { formatarData } from "@/lib/utils";
import type { PedidoWorkspaceData } from "./types";

type ResumoSectionProps = Pick<
  PedidoWorkspaceData,
  | "pedido"
  | "diasRestantes"
  | "responsavelDefinido"
  | "percentualConclusao"
  | "proximaAcao"
  | "prontidaoAprovacao"
>;

function classificarUrgencia(dias: number): { label: string; variant: "sucesso" | "implantacao" | "alerta" } {
  if (dias < 0) return { label: `Vencido há ${Math.abs(dias)} dia(s)`, variant: "alerta" };
  if (dias === 0) return { label: "Vence hoje", variant: "alerta" };
  if (dias <= 3) return { label: `Vence em ${dias} dia(s)`, variant: "implantacao" };
  return { label: `Vence em ${dias} dia(s)`, variant: "sucesso" };
}

export function ResumoSection({
  pedido,
  diasRestantes,
  responsavelDefinido,
  percentualConclusao,
  proximaAcao,
  prontidaoAprovacao,
}: ResumoSectionProps) {
  const urgencia = classificarUrgencia(diasRestantes);

  return (
    <div className="space-y-6">
      <Card title="Resumo do pedido" subtitle="Dados essenciais do caso e do pedido de peça." eyebrow="Intake">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-muted-strong)]">Cliente / Caso</p>
            <p className="mt-1 text-sm font-semibold text-[var(--color-ink)]">{pedido.casoId}</p>
            <p className="text-xs text-[var(--color-muted)]">{pedido.titulo}</p>
          </div>

          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-muted-strong)]">Tipo de peça</p>
            <p className="mt-1 text-sm font-semibold text-[var(--color-ink)]">{pedido.tipoPeca}</p>
            <p className="text-xs text-[var(--color-muted)]">{pedido.intencaoProcessual?.replaceAll("_", " ") ?? "Não informado"}</p>
          </div>

          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-muted-strong)]">Prazo e urgência</p>
            <div className="mt-1 flex items-center gap-2">
              <p className="text-sm font-semibold text-[var(--color-ink)]">{formatarData(pedido.prazoFinal)}</p>
              <StatusBadge label={urgencia.label} variant={urgencia.variant} />
            </div>
            <p className="text-xs text-[var(--color-muted)]">Prioridade: {pedido.prioridade}</p>
          </div>

          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-muted-strong)]">Responsável e status</p>
            <p className="mt-1 text-sm font-semibold text-[var(--color-ink)]">
              {responsavelDefinido ? pedido.responsavel : "Atribuição pendente"}
            </p>
            <div className="mt-1">
              <StatusBadge label={pedido.status} variant={pedido.status === "aprovado" ? "sucesso" : "implantacao"} />
            </div>
          </div>
        </div>

        {!responsavelDefinido ? (
          <InlineAlert title="Atenção" variant="warning" className="mt-4">
            Responsável obrigatório pendente. O fluxo operacional continua bloqueado até existir um responsável formal.
          </InlineAlert>
        ) : null}
      </Card>

      <Card
        title="Progresso do pedido"
        subtitle="Conclusão das etapas de construção jurídica da peça."
        eyebrow="Andamento"
      >
        <div className="flex items-center gap-4">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-[var(--color-border)]">
            <div
              className="h-full rounded-full bg-[var(--color-accent)] transition-all"
              style={{ width: `${percentualConclusao}%` }}
            />
          </div>
          <p className="text-sm font-semibold text-[var(--color-ink)]">{percentualConclusao}%</p>
        </div>

        {prontidaoAprovacao ? (
          <div className="mt-4 flex items-center gap-2">
            <StatusBadge
              label={prontidaoAprovacao.liberado ? "Pronto para aprovação" : `${prontidaoAprovacao.bloqueios.length} bloqueio(s)`}
              variant={prontidaoAprovacao.liberado ? "sucesso" : "alerta"}
            />
          </div>
        ) : null}
      </Card>

      {proximaAcao ? (
        <Card title="Próxima ação recomendada" subtitle="Foco operacional para destravar o pedido." eyebrow="Ação">
          <div className="space-y-4">
            <div className="rounded-[1.2rem] border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-4">
              <p className="text-sm font-semibold text-[var(--color-ink)]">{proximaAcao.titulo}</p>
              <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">{proximaAcao.descricao}</p>
            </div>
            <ButtonLink href={proximaAcao.href} label={proximaAcao.label} />
          </div>
        </Card>
      ) : null}
    </div>
  );
}
