"use client";

import { useState } from "react";
import type { GoogleWorkspaceReadiness } from "@/modules/administracao/domain/google-workspace";
import type { AgendaViewMode } from "@/modules/agenda/domain/types";
import { EVENTOS_AGENDA_DEMO } from "@/modules/agenda/domain/types";
import { Card } from "@/components/ui/card";
import { InlineAlert } from "@/components/ui/inline-alert";
import { StatusBadge } from "@/components/ui/status-badge";
import { CalendarIcon, ChevronRightIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

type AgendaWorkspaceProps = {
  readiness: GoogleWorkspaceReadiness;
  calendarId: string;
  authMode: string;
};

const VIEW_OPTIONS: Array<{ id: AgendaViewMode; label: string }> = [
  { id: "mes", label: "Mês" },
  { id: "semana", label: "Semana" },
  { id: "dia", label: "Dia" },
];

const DIAS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

export function AgendaWorkspace({ readiness, calendarId, authMode }: AgendaWorkspaceProps) {
  const [view, setView] = useState<AgendaViewMode>("semana");

  return (
    <div className="space-y-6">
      {!readiness.agendaOk ? (
        <InlineAlert title="Agenda ainda não conectada" variant="warning">
          A fundação já está preparada, mas a Agenda profissional depende de OAuth por usuário e calendar ID válido.
        </InlineAlert>
      ) : (
        <InlineAlert title="Agenda apta para integração" variant="success">
          A configuração base já comporta sincronização com Google Calendar, criação de eventos vinculados e visão operacional por responsável.
        </InlineAlert>
      )}

      <div className="grid gap-4 xl:grid-cols-[1.5fr,0.95fr]">
        <Card
          title="Workspace da Agenda"
          subtitle="Estrutura visual da futura agenda jurídica unificada."
          eyebrow="Calendário"
          headerActions={
            <div className="flex flex-wrap gap-2">
              {VIEW_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setView(option.id)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                    view === option.id
                      ? "border-[var(--color-accent)] bg-[var(--color-accent)] text-white"
                      : "border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-muted)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]",
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          }
        >
          <div className="rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-card-strong)] p-4">
            <div className="grid grid-cols-7 gap-2">
              {DIAS.map((dia) => (
                <div key={dia} className="rounded-2xl px-2 py-2 text-center text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-muted-strong)]">
                  {dia}
                </div>
              ))}
              {Array.from({ length: 35 }, (_, index) => {
                const dia = index + 1;
                const evento = EVENTOS_AGENDA_DEMO[index % EVENTOS_AGENDA_DEMO.length];
                const ativo = index === 9 || index === 10 || index === 18;
                return (
                  <div
                    key={dia}
                    className={cn(
                      "min-h-[108px] rounded-[1.25rem] border p-3",
                      ativo
                        ? "border-[var(--color-accent)] bg-[color-mix(in_srgb,var(--color-accent)_9%,white)]"
                        : "border-[var(--color-border)] bg-[var(--color-card)]",
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-[var(--color-ink)]">{dia}</p>
                      {ativo ? <StatusBadge label="evento" variant="implantacao" /> : null}
                    </div>
                    {ativo ? (
                      <div className="mt-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-3 py-2">
                        <p className="text-[11px] font-semibold text-[var(--color-accent)]">{evento.horario}</p>
                        <p className="mt-1 text-xs font-medium text-[var(--color-ink)]">{evento.titulo}</p>
                      </div>
                    ) : (
                      <p className="mt-6 text-[11px] text-[var(--color-muted)]">
                        Espaço para prazos, audiências e compromissos sincronizados.
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </Card>

        <div className="space-y-4">
          <Card title="Prontidão técnica" subtitle="Como a integração Google será usada pelo módulo." eyebrow="Infraestrutura">
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-4 py-3">
                <span className="text-sm text-[var(--color-muted)]">Modo Google</span>
                <StatusBadge label={authMode.replace(/_/g, " ")} variant="neutro" />
              </div>
              <div className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-4 py-3">
                <span className="text-sm text-[var(--color-muted)]">Calendar ID</span>
                <span className="font-mono text-xs text-[var(--color-ink)]">{calendarId || "não definido"}</span>
              </div>
              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-4">
                <p className="text-sm font-semibold text-[var(--color-ink)]">Fluxos previstos</p>
                <div className="mt-3 space-y-2 text-xs text-[var(--color-muted)]">
                  <p>1. Audiências e prazos vinculados a casos.</p>
                  <p>2. Reuniões internas por responsável e carteira.</p>
                  <p>3. Criação de evento a partir de pedido, caso ou cliente.</p>
                  <p>4. Timeline operacional no detalhe do caso e das petições.</p>
                </div>
              </div>
            </div>
          </Card>

          <Card title="Hoje na operação" subtitle="Exemplo de painel lateral semelhante a um calendário jurídico." eyebrow="Agenda lateral">
            <div className="space-y-3">
              {EVENTOS_AGENDA_DEMO.map((evento) => (
                <div key={evento.id} className="rounded-[1.2rem] border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-accent)]">
                        <CalendarIcon size={16} />
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-[var(--color-ink)]">{evento.titulo}</p>
                        <p className="mt-1 text-xs text-[var(--color-muted)]">
                          {evento.horario} · {evento.responsavel}
                        </p>
                        <p className="mt-1 text-xs text-[var(--color-muted)]">{evento.origem}</p>
                      </div>
                    </div>
                    {evento.destaque ? <StatusBadge label="prioritário" variant="alerta" /> : null}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Próxima entrega" subtitle="O que falta para sair do shell e virar módulo operacional real." eyebrow="Roadmap">
            <div className="space-y-2">
              {[
                "Conectar OAuth Google e callback seguro por usuário.",
                "Listar calendários acessíveis e persistir tokens.",
                "Sincronizar eventos com casos, clientes e petições.",
                "Criar modais de novo evento, remarcação e confirmação de audiência.",
              ].map((item) => (
                <div key={item} className="flex items-center gap-2 text-sm text-[var(--color-muted)]">
                  <ChevronRightIcon size={15} className="text-[var(--color-accent)]" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
