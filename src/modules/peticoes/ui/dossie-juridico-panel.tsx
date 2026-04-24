import { Card } from "@/components/ui/card";
import { InlineAlert } from "@/components/ui/inline-alert";
import { StatusBadge } from "@/components/ui/status-badge";
import type { ContextoJuridicoPedido } from "@/modules/peticoes/domain/types";

type DossieJuridicoPanelProps = {
  contextoAtual: ContextoJuridicoPedido | null;
  compact?: boolean;
};

function percentualLabel(value: number) {
  return `${Math.round(value * 100)}%`;
}

export function DossieJuridicoPanel({
  contextoAtual,
  compact = false,
}: DossieJuridicoPanelProps) {
  const dossie = contextoAtual?.dossieJuridico;

  return (
    <Card
      title="Dossiê jurídico"
      subtitle="Camada intermediária entre intake, leitura documental, fatos, diagnóstico e futura construção da peça."
      eyebrow="Estrutura"
    >
      {!contextoAtual || !dossie ? (
        <p className="text-sm text-[var(--color-muted)]">
          O dossiê jurídico ainda não foi consolidado para este pedido.
        </p>
      ) : (
        <div className="space-y-5">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-muted-strong)]">
                Documentos
              </p>
              <p className="font-serif text-3xl text-[var(--color-ink)]">
                {dossie.leituraDocumentalEstruturada.totalDocumentos}
              </p>
            </div>
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-muted-strong)]">
                Cobertura de leitura
              </p>
              <p className="font-serif text-3xl text-[var(--color-ink)]">
                {percentualLabel(dossie.leituraDocumentalEstruturada.coberturaLeitura)}
              </p>
            </div>
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-muted-strong)]">
                Fatos com prova
              </p>
              <p className="font-serif text-3xl text-[var(--color-ink)]">{dossie.matrizFatosEProvas.length}</p>
            </div>
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-muted-strong)]">
                Tese liberada
              </p>
              <p className="mt-2">
                <StatusBadge
                  label={dossie.estrategiaAprovada.liberadaParaEstruturacao ? "sim" : "não"}
                  variant={dossie.estrategiaAprovada.liberadaParaEstruturacao ? "sucesso" : "alerta"}
                />
              </p>
            </div>
          </div>

          {!compact ? (
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-4">
              <p className="text-sm font-semibold text-[var(--color-ink)]">Resumo executivo do dossiê</p>
              <p className="mt-2 text-sm text-[var(--color-muted)]">
                {dossie.briefingJuridico.resumoExecutivo}
              </p>
            </div>
          ) : null}

          <div className="grid gap-4 xl:grid-cols-2">
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-4">
              <p className="text-sm font-semibold text-[var(--color-ink)]">Leitura documental estruturada</p>
              <div className="mt-3 space-y-2 text-sm text-[var(--color-muted)]">
                <p>
                  <strong className="text-[var(--color-ink)]">Documentos lidos:</strong>{" "}
                  {dossie.leituraDocumentalEstruturada.documentosLidos} de {dossie.leituraDocumentalEstruturada.totalDocumentos}
                </p>
                <p>
                  <strong className="text-[var(--color-ink)]">Referências documentais:</strong>{" "}
                  {dossie.leituraDocumentalEstruturada.referenciasDocumentais.length}
                </p>
              </div>
              {dossie.leituraDocumentalEstruturada.lacunasDocumentais.length > 0 ? (
                <div className="mt-3 space-y-2">
                  {dossie.leituraDocumentalEstruturada.lacunasDocumentais.map((item) => (
                    <InlineAlert key={item} title="Lacuna documental" variant="warning">
                      {item}
                    </InlineAlert>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm text-[var(--color-muted)]">
                  Sem lacunas documentais relevantes neste momento.
                </p>
              )}
            </div>

            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-4">
              <p className="text-sm font-semibold text-[var(--color-ink)]">Diagnóstico estratégico</p>
              <p className="mt-3 text-sm text-[var(--color-muted)]">
                {dossie.diagnosticoEstrategico.diretrizPrincipal}
              </p>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-muted-strong)]">
                    Alavancas
                  </p>
                  <ul className="mt-2 space-y-1 text-sm text-[var(--color-muted)]">
                    {dossie.diagnosticoEstrategico.alavancas.slice(0, 4).map((item) => (
                      <li key={item}>• {item}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-muted-strong)]">
                    Fragilidades
                  </p>
                  <ul className="mt-2 space-y-1 text-sm text-[var(--color-muted)]">
                    {dossie.diagnosticoEstrategico.fragilidades.slice(0, 4).map((item) => (
                      <li key={item}>• {item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-4">
            <p className="text-sm font-semibold text-[var(--color-ink)]">Matriz de fatos e provas</p>
            {dossie.matrizFatosEProvas.length === 0 ? (
              <p className="mt-3 text-sm text-[var(--color-muted)]">
                A matriz ainda não identificou fatos com cobertura probatória suficiente.
              </p>
            ) : (
              <div className="mt-3 space-y-3">
                {dossie.matrizFatosEProvas.slice(0, compact ? 2 : 5).map((item) => (
                  <article
                    key={item.id}
                    className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-[var(--color-ink)]">{item.fato}</p>
                      <div className="flex gap-2">
                        <StatusBadge label={item.grauCobertura} variant={item.grauCobertura === "forte" ? "sucesso" : item.grauCobertura === "moderada" ? "implantacao" : "alerta"} />
                        {item.controverso ? <StatusBadge label="controverso" variant="alerta" /> : null}
                      </div>
                    </div>
                    <p className="mt-2 text-xs text-[var(--color-muted)]">
                      Provas relacionadas: {item.provasRelacionadas.length}
                    </p>
                    {!compact && item.provasRelacionadas.length > 0 ? (
                      <ul className="mt-2 space-y-1 text-xs text-[var(--color-muted)]">
                        {item.provasRelacionadas.map((prova) => (
                          <li key={`${item.id}-${prova.documentoId}`}>
                            • {prova.documentoId} — {prova.titulo} ({prova.tipoDocumento})
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}
