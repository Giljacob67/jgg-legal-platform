"use client";

import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { AuditoriaAprovacaoPanel } from "@/modules/peticoes/ui/auditoria-aprovacao-panel";
import { formatarDataHora } from "@/lib/utils";
import type { PedidoWorkspaceData } from "./types";

type RevisaoAuditoriaSectionProps = Pick<
  PedidoWorkspaceData,
  "historico" | "prontidaoAprovacao" | "snapshots" | "etapaAtual"
>;

export function RevisaoAuditoriaSection({
  historico,
  prontidaoAprovacao,
  snapshots,
  
}: RevisaoAuditoriaSectionProps) {
  const snapshotsConcluidos = snapshots.filter((s) => s.status === "concluido");
  const snapshotsErro = snapshots.filter((s) => s.status === "erro");

  return (
    <div className="space-y-6">
      {prontidaoAprovacao ? (
        <AuditoriaAprovacaoPanel prontidao={prontidaoAprovacao} />
      ) : null}

      <Card
        title="Timeline do pedido"
        subtitle="Histórico cronológico de eventos operacionais e técnicos."
        eyebrow="Rastro"
      >
        {historico.length === 0 ? (
          <p className="text-sm text-[var(--color-muted)]">Sem eventos registrados até o momento.</p>
        ) : (
          <div className="space-y-3">
            {historico.map((item) => (
              <article
                key={item.id}
                className="rounded-[1.2rem] border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-[var(--color-ink)]">{item.descricao}</p>
                  <p className="text-xs text-[var(--color-muted)]">{formatarDataHora(item.data)}</p>
                </div>
                <p className="mt-2 text-xs text-[var(--color-muted)]">
                  Etapa: {item.etapa.replaceAll("_", " ")} • Responsável: {item.responsavel}
                </p>
              </article>
            ))}
          </div>
        )}
      </Card>

      <Card
        title="Snapshots do pipeline"
        subtitle="Registros versionados de cada estágio executado pela IA."
        eyebrow="Auditoria técnica"
      >
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-muted-strong)]">Total</p>
            <p className="font-serif text-3xl text-[var(--color-ink)]">{snapshots.length}</p>
          </div>
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-muted-strong)]">Concluídos</p>
            <p className="font-serif text-3xl text-[var(--color-ink)]">{snapshotsConcluidos.length}</p>
          </div>
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-muted-strong)]">Com erro</p>
            <p className="font-serif text-3xl text-[var(--color-ink)]">{snapshotsErro.length}</p>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          {snapshots.slice().reverse().map((snapshot) => (
            <article
              key={`${snapshot.id}-${snapshot.versao}`}
              className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-[var(--color-ink)]">
                  {snapshot.etapa.replaceAll("_", " ")} — v{snapshot.versao}
                </p>
                <StatusBadge
                  label={snapshot.status}
                  variant={
                    snapshot.status === "concluido"
                      ? "sucesso"
                      : snapshot.status === "erro"
                        ? "alerta"
                        : "implantacao"
                  }
                />
              </div>
              <p className="mt-1 text-xs text-[var(--color-muted)]">
                Executado em: {formatarDataHora(snapshot.executadoEm)} • Tentativa: {snapshot.tentativa}
              </p>
              {snapshot.mensagemErro ? (
                <p className="mt-1 text-xs text-rose-700">Erro: {snapshot.mensagemErro}</p>
              ) : null}
            </article>
          ))}
        </div>
      </Card>
    </div>
  );
}
