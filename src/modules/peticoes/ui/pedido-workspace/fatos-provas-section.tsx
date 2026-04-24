"use client";

import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { InlineAlert } from "@/components/ui/inline-alert";
import { SearchIcon } from "@/components/ui/icons";
import type { PedidoWorkspaceData } from "./types";

type FatosProvasSectionProps = Pick<PedidoWorkspaceData, "dossie">;

function coberturaVariant(grau: string): "sucesso" | "implantacao" | "alerta" {
  if (grau === "forte") return "sucesso";
  if (grau === "moderada") return "implantacao";
  return "alerta";
}

export function FatosProvasSection({ dossie }: FatosProvasSectionProps) {
  const matriz = dossie?.matrizFatosEProvas ?? [];

  return (
    <div className="space-y-6">
      <Card
        title="Matriz de fatos e provas"
        subtitle="Cada fato mapeado com seu lastro probatório, cobertura e grau de controvérsia."
        eyebrow="Prova"
      >
        {matriz.length === 0 ? (
          <EmptyState
            title="Matriz ainda não construída"
            message="Execute o estágio de extração de fatos ou adicione fatos manualmente para formar a matriz probatória."
            icon={<SearchIcon size={22} />}
          />
        ) : (
          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-muted-strong)]">Fatos mapeados</p>
                <p className="font-serif text-3xl text-[var(--color-ink)]">{matriz.length}</p>
              </div>
              <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-muted-strong)]">Com prova forte</p>
                <p className="font-serif text-3xl text-[var(--color-ink)]">{matriz.filter((m) => m.grauCobertura === "forte").length}</p>
              </div>
              <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-muted-strong)]">Controversos</p>
                <p className="font-serif text-3xl text-[var(--color-ink)]">{matriz.filter((m) => m.controverso).length}</p>
              </div>
            </div>

            <div className="space-y-3">
              {matriz.map((item) => (
                <article
                  key={item.id}
                  className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-[var(--color-ink)]">{item.fato}</p>
                    <div className="flex gap-2">
                      <StatusBadge label={item.grauCobertura} variant={coberturaVariant(item.grauCobertura)} />
                      {item.controverso ? <StatusBadge label="controverso" variant="alerta" /> : null}
                    </div>
                  </div>

                  {item.provasRelacionadas.length > 0 ? (
                    <div className="mt-3">
                      <p className="text-xs font-semibold text-[var(--color-muted-strong)]">Provas relacionadas</p>
                      <ul className="mt-1 space-y-1 text-xs text-[var(--color-muted)]">
                        {item.provasRelacionadas.map((prova) => (
                          <li key={prova.documentoId}>
                            • {prova.titulo} ({prova.tipoDocumento})
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <InlineAlert className="mt-3" title="Sem prova identificada" variant="warning">
                      Este fato ainda não possui documento de suporte vinculado.
                    </InlineAlert>
                  )}
                </article>
              ))}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
