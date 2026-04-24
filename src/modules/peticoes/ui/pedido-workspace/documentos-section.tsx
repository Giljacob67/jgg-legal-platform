"use client";

import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { InlineAlert } from "@/components/ui/inline-alert";
import { SearchIcon } from "@/components/ui/icons";
import { formatarData } from "@/lib/utils";
import type { PedidoWorkspaceData } from "./types";

type DocumentosSectionProps = Pick<PedidoWorkspaceData, "documentos" | "dossie">;

function relevanciaVariant(relevancia?: string): "sucesso" | "implantacao" | "alerta" | "neutro" {
  if (relevancia === "alta") return "sucesso";
  if (relevancia === "media") return "implantacao";
  if (relevancia === "baixa") return "neutro";
  return "neutro";
}

export function DocumentosSection({ documentos, dossie }: DocumentosSectionProps) {
  const leitura = dossie?.leituraDocumentalEstruturada;

  return (
    <div className="space-y-6">
      <Card
        title="Documentos vinculados"
        subtitle="Material disponível para leitura, estratégia e redação da peça."
        eyebrow="Documentação"
      >
        {documentos.length === 0 ? (
          <EmptyState
            title="Nenhum documento vinculado"
            message="Anexe documentos ao caso ou ao pedido para alimentar o contexto jurídico e a redação."
            icon={<SearchIcon size={22} />}
          />
        ) : (
          <div className="space-y-4">
            {leitura ? (
              <div className="grid gap-3 md:grid-cols-4">
                <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-muted-strong)]">Total</p>
                  <p className="font-serif text-3xl text-[var(--color-ink)]">{leitura.totalDocumentos}</p>
                </div>
                <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-muted-strong)]">Lidos</p>
                  <p className="font-serif text-3xl text-[var(--color-ink)]">{leitura.documentosLidos}</p>
                </div>
                <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-muted-strong)]">Cobertura</p>
                  <p className="font-serif text-3xl text-[var(--color-ink)]">{Math.round(leitura.coberturaLeitura * 100)}%</p>
                </div>
                <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-muted-strong)]">Lacunas</p>
                  <p className="font-serif text-3xl text-[var(--color-ink)]">{leitura.lacunasDocumentais.length}</p>
                </div>
              </div>
            ) : null}

            <div className="grid gap-3 md:grid-cols-2">
              {documentos.map((doc) => {
                const docLeitura = leitura?.documentosChave.find((d) => d.documentoId === doc.id);
                const status = doc.status;
                return (
                  <article
                    key={doc.id}
                    className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[var(--color-ink)]">{doc.titulo}</p>
                        <p className="mt-1 text-xs text-[var(--color-muted)]">
                          {doc.tipo} • {formatarData(doc.dataUpload)}
                        </p>
                      </div>
                      <StatusBadge
                        label={status}
                        variant={status === "extraído" ? "sucesso" : status === "lido" ? "implantacao" : "neutro"}
                      />
                    </div>

                    <div className="mt-3 grid gap-2 text-xs text-[var(--color-muted)] sm:grid-cols-2">
                      <p>
                        <strong className="text-[var(--color-muted-strong)]">Processamento:</strong>{" "}
                        {doc.statusProcessamento.replaceAll("_", " ")}
                      </p>
                      <p>
                        <strong className="text-[var(--color-muted-strong)]">Relevância:</strong>{" "}
                        {docLeitura ? (
                          <StatusBadge
                            label={docLeitura.tipoDocumento === "alta" ? "alta" : docLeitura.tipoDocumento}
                            variant={relevanciaVariant(docLeitura.tipoDocumento)}
                          />
                        ) : (
                          "Não avaliada"
                        )}
                      </p>
                    </div>

                    {doc.resumo ? (
                      <div className="mt-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-3">
                        <p className="text-xs font-semibold text-[var(--color-muted-strong)]">Fatos extraídos / Resumo jurídico</p>
                        <p className="mt-1 text-xs text-[var(--color-muted)] line-clamp-3">{doc.resumo}</p>
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>

            {leitura && leitura.lacunasDocumentais.length > 0 ? (
              <div className="space-y-2">
                <p className="text-sm font-semibold text-[var(--color-ink)]">Lacunas documentais</p>
                {leitura.lacunasDocumentais.map((lacuna) => (
                  <InlineAlert key={lacuna} title="Lacuna identificada" variant="warning">
                    {lacuna}
                  </InlineAlert>
                ))}
              </div>
            ) : null}
          </div>
        )}
      </Card>
    </div>
  );
}
