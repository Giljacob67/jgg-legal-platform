"use client";

import { Card } from "@/components/ui/card";
import { InlineAlert } from "@/components/ui/inline-alert";
import { EmptyState } from "@/components/ui/empty-state";
import { FileIcon } from "@/components/ui/icons";
import type { PedidoWorkspaceData } from "./types";

type BriefingSectionProps = Pick<PedidoWorkspaceData, "pedido" | "contextoAtual" | "dossie">;

export function BriefingSection({ pedido, contextoAtual, dossie }: BriefingSectionProps) {
  const briefing = dossie?.briefingJuridico;
  const contextoCaso = dossie?.contextoDoCaso;

  const infosFaltantes: string[] = [];
  if (!pedido.intencaoProcessual) infosFaltantes.push("Objetivo processual não informado.");
  if (!contextoCaso || contextoCaso.fatosRelevantes.length === 0) infosFaltantes.push("Fatos relevantes não registrados.");
  if (!briefing?.resumoExecutivo) infosFaltantes.push("Resumo executivo não consolidado.");

  return (
    <div className="space-y-6">
      <Card title="Briefing jurídico" subtitle="Base de inteligência do pedido, construída no intake e refinada ao longo do caso." eyebrow="Base">
        {!contextoAtual && !briefing ? (
          <EmptyState
            title="Briefing ainda não consolidado"
            message="O dossiê jurídico ainda não foi gerado para este pedido. Execute o pipeline de triagem para iniciar a construção do briefing."
            icon={<FileIcon size={22} />}
          />
        ) : (
          <div className="space-y-5">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-4">
                <p className="text-sm font-semibold text-[var(--color-ink)]">Objetivo processual</p>
                <p className="mt-2 text-sm text-[var(--color-muted)]">
                  {pedido.intencaoProcessual?.replaceAll("_", " ") ?? "Não informado no momento da abertura."}
                </p>
              </div>

              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-4">
                <p className="text-sm font-semibold text-[var(--color-ink)]">Pergunta jurídica central</p>
                <p className="mt-2 text-sm text-[var(--color-muted)]">
                  {contextoAtual?.estrategiaSugerida ?? "Ainda não formulada. Aguarde a etapa de estratégia jurídica."}
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-4">
              <p className="text-sm font-semibold text-[var(--color-ink)]">Contexto informado pelo advogado</p>
              <p className="mt-2 text-sm text-[var(--color-muted)]">
                {briefing?.resumoExecutivo ?? contextoAtual?.fatosRelevantes.slice(0, 3).join("; ") ?? "Nenhum contexto formal registrado."}
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-4">
                <p className="text-sm font-semibold text-[var(--color-ink)]">Resultado prático pretendido</p>
                <p className="mt-2 text-sm text-[var(--color-muted)]">
                  {pedido.intencaoProcessual
                    ? `Produzir ${pedido.tipoPeca} com o objetivo de ${pedido.intencaoProcessual.replaceAll("_", " ")}.`
                    : "Ainda não definido."}
                </p>
              </div>

              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-4">
                <p className="text-sm font-semibold text-[var(--color-ink)]">Informações faltantes</p>
                {infosFaltantes.length > 0 ? (
                  <ul className="mt-2 space-y-1 text-sm text-[var(--color-muted)]">
                    {infosFaltantes.map((item) => (
                      <li key={item}>• {item}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm text-[var(--color-muted)]">Nenhuma informação crítica faltante identificada.</p>
                )}
              </div>
            </div>

            {infosFaltantes.length > 0 ? (
              <InlineAlert title="Briefing incompleto" variant="warning">
                O pedido possui lacunas de informação que podem comprometer a qualidade da peça final. Complete o intake ou execute o pipeline para consolidar o briefing.
              </InlineAlert>
            ) : null}
          </div>
        )}
      </Card>
    </div>
  );
}
