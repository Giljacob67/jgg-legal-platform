"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { ButtonLink } from "@/components/ui/button-link";
import { FileIcon } from "@/components/ui/icons";
import { formatarDataHora } from "@/lib/utils";
import type { PedidoWorkspaceData } from "./types";

type MinutaSectionProps = Pick<PedidoWorkspaceData, "minuta" | "pedido">;

export function MinutaSection({ minuta, pedido }: MinutaSectionProps) {
  return (
    <div className="space-y-6">
      <Card
        title="Minuta da peça"
        subtitle="Redação jurídica produzida a partir da estrutura e da estratégia aprovadas."
        eyebrow="Redação"
      >
        {!minuta ? (
          <div className="space-y-4">
            <EmptyState
              title="Minuta ainda não gerada"
              message="A minuta será produzida após a aprovação da estratégia e da estrutura da peça. Execute o estágio de redação no pipeline."
              icon={<FileIcon size={22} />}
            />
            <div className="flex justify-center">
              <ButtonLink
                href={`/peticoes/pipeline/${pedido.id}`}
                label="Ir para pipeline"
                variant="secundario"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <StatusBadge label="Minuta disponível" variant="sucesso" />
                <p className="text-sm text-[var(--color-muted)]">{minuta.titulo}</p>
              </div>
              <Link
                href={`/peticoes/minutas/${minuta.id}/editor`}
                className="rounded-xl bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-white"
              >
                Abrir editor
              </Link>
            </div>

            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-4">
              <p className="text-sm font-semibold text-[var(--color-ink)]">Conteúdo atual (prévia)</p>
              <div className="mt-3 max-h-[400px] overflow-y-auto rounded-xl border border-[var(--color-border)] bg-white p-4">
                <pre className="whitespace-pre-wrap font-serif text-sm leading-relaxed text-[var(--color-ink)]">
                  {minuta.conteudoAtual.slice(0, 2000)}
                  {minuta.conteudoAtual.length > 2000 ? "\n\n[...]" : ""}
                </pre>
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-4">
              <p className="text-sm font-semibold text-[var(--color-ink)]">Histórico de versões</p>
              <div className="mt-3 space-y-3">
                {minuta.versoes.slice().reverse().map((versao) => (
                  <article
                    key={versao.id}
                    className="flex items-center justify-between gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-3"
                  >
                    <div>
                      <p className="text-sm font-semibold text-[var(--color-ink)]">Versão {versao.numero}</p>
                      <p className="text-xs text-[var(--color-muted)]">
                        {versao.autor} • {formatarDataHora(versao.criadoEm)}
                      </p>
                    </div>
                    <StatusBadge label="registrada" variant="sucesso" />
                  </article>
                ))}
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
