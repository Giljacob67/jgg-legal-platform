"use client";

import { startTransition, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { InlineAlert } from "@/components/ui/inline-alert";
import { StatusBadge } from "@/components/ui/status-badge";
import { TextInput } from "@/components/ui/text-input";
import { TextareaInput } from "@/components/ui/textarea-input";
import { resumirMapaTeses, teseFoiValidadaHumanamente } from "@/modules/peticoes/application/teses-juridicas";
import type { ContextoJuridicoPedido, TeseJuridicaPedido } from "@/modules/peticoes/domain/types";

type MapaTesesPanelProps = {
  pedidoId: string;
  contextoAtual: ContextoJuridicoPedido | null;
  compact?: boolean;
};

type FormState = {
  teseId?: string;
  origem: "ia" | "usuario";
  titulo: string;
  descricao: string;
  fundamentos: string;
  observacoesHumanas: string;
};

const STATUS_LABEL: Record<TeseJuridicaPedido["statusValidacao"], string> = {
  pendente: "pendente",
  aprovada: "aprovada",
  rejeitada: "rejeitada",
  ajustada: "ajustada",
};

const STATUS_VARIANT: Record<TeseJuridicaPedido["statusValidacao"], "neutro" | "sucesso" | "alerta" | "implantacao"> = {
  pendente: "implantacao",
  aprovada: "sucesso",
  rejeitada: "alerta",
  ajustada: "neutro",
};

function teseToFormState(tese: TeseJuridicaPedido): FormState {
  return {
    teseId: tese.id,
    origem: tese.origem,
    titulo: tese.titulo,
    descricao: tese.descricao,
    fundamentos: tese.fundamentos.join("\n"),
    observacoesHumanas: tese.observacoesHumanas ?? "",
  };
}

function criarFormManual(): FormState {
  return {
    origem: "usuario",
    titulo: "",
    descricao: "",
    fundamentos: "",
    observacoesHumanas: "",
  };
}

export function MapaTesesPanel({
  pedidoId,
  contextoAtual,
  compact = false,
}: MapaTesesPanelProps) {
  const router = useRouter();
  const [editorAberto, setEditorAberto] = useState<string | "manual" | null>(null);
  const [form, setForm] = useState<FormState>(criarFormManual());
  const [loading, setLoading] = useState(false);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const resumo = useMemo(
    () => resumirMapaTeses(contextoAtual?.teses ?? []),
    [contextoAtual?.teses],
  );

  const faltando = useMemo(() => {
    if (!contextoAtual) {
      return ["Consolidar contexto jurídico antes de validar teses."];
    }

    const itens: string[] = [];
    if (resumo.validadas === 0) {
      itens.push("Confirmar ao menos uma tese para liberar a estratégia consolidada.");
    }
    if (resumo.inferidasPendentes > 0) {
      itens.push(`${resumo.inferidasPendentes} tese(s) inferida(s) ainda aguardam decisão humana.`);
    }
    return itens;
  }, [contextoAtual, resumo.inferidasPendentes, resumo.validadas]);

  async function registrarTese(payload: {
    teseId?: string;
    origem: "ia" | "usuario";
    titulo: string;
    descricao: string;
    fundamentos: string[];
    observacoesHumanas?: string;
    statusValidacao: "aprovada" | "rejeitada" | "ajustada";
  }) {
    setLoading(true);
    setErro(null);
    setMensagem(null);

    try {
      const response = await fetch(`/api/peticoes/pipeline/${pedidoId}/teses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          acao: "registrar_tese",
          ...payload,
        }),
      });

      const json = (await response.json()) as { error?: string };
      if (!response.ok) {
        setErro(json.error ?? "Não foi possível salvar a validação da tese.");
        return;
      }

      setMensagem(
        payload.statusValidacao === "rejeitada"
          ? "Tese rejeitada e registrada na trilha do contexto."
          : payload.origem === "usuario" && !payload.teseId
            ? "Tese manual adicionada à estratégia do pedido."
            : "Tese validada com sucesso.",
      );
      setEditorAberto(null);
      setForm(criarFormManual());
      startTransition(() => router.refresh());
    } catch (event) {
      setErro(event instanceof Error ? event.message : "Erro desconhecido ao registrar tese.");
    } finally {
      setLoading(false);
    }
  }

  function abrirEditorTese(tese: TeseJuridicaPedido) {
    setEditorAberto(tese.id);
    setForm(teseToFormState(tese));
    setErro(null);
    setMensagem(null);
  }

  function abrirNovaTeseManual() {
    setEditorAberto("manual");
    setForm(criarFormManual());
    setErro(null);
    setMensagem(null);
  }

  function fecharEditor() {
    setEditorAberto(null);
    setForm(criarFormManual());
  }

  async function salvarEdicaoComoAjustada() {
    await registrarTese({
      teseId: form.teseId,
      origem: form.origem,
      titulo: form.titulo,
      descricao: form.descricao,
      fundamentos: form.fundamentos.split("\n").map((item) => item.trim()).filter(Boolean),
      observacoesHumanas: form.observacoesHumanas,
      statusValidacao: form.teseId ? "ajustada" : "aprovada",
    });
  }

  const tesesInferidas = (contextoAtual?.teses ?? []).filter((tese) => tese.origem === "ia");
  const tesesConfirmadas = (contextoAtual?.teses ?? []).filter(teseFoiValidadaHumanamente);
  const dossie = contextoAtual?.dossieJuridico;

  return (
    <Card
      title="Mapa de teses"
      subtitle="Validação humana obrigatória das teses candidatas derivadas da análise adversa e do diagnóstico estratégico."
      eyebrow="Estratégia"
    >
      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-muted-strong)]">
            Inferido pelo sistema
          </p>
          <p className="font-serif text-3xl text-[var(--color-ink)]">{tesesInferidas.length}</p>
          <p className="text-xs text-[var(--color-muted)]">{resumo.inferidasPendentes} pendente(s) de decisão</p>
        </div>
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-muted-strong)]">
            Confirmado pelo humano
          </p>
          <p className="font-serif text-3xl text-[var(--color-ink)]">{tesesConfirmadas.length}</p>
          <p className="text-xs text-[var(--color-muted)]">Teses aprovadas ou ajustadas manualmente</p>
        </div>
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-muted-strong)]">
            Faltando validar
          </p>
          <p className="font-serif text-3xl text-[var(--color-ink)]">{faltando.length}</p>
          <p className="text-xs text-[var(--color-muted)]">
            {contextoAtual?.validacaoHumanaTesesPendente ? "Aprovação final segue bloqueada." : "Fluxo liberado."}
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {faltando.length > 0 ? (
          faltando.map((item) => (
            <InlineAlert key={item} title="Ponto pendente" variant="warning">
              {item}
            </InlineAlert>
          ))
        ) : (
          <InlineAlert title="Teses validadas" variant="success">
            O pedido já possui tese confirmada e sem inferências pendentes para triagem humana.
          </InlineAlert>
        )}
        {mensagem ? (
          <InlineAlert title="Atualização registrada" variant="success">
            {mensagem}
          </InlineAlert>
        ) : null}
        {erro ? (
          <InlineAlert title="Falha ao salvar" variant="warning">
            {erro}
          </InlineAlert>
        ) : null}
      </div>

      {dossie ? (
        <div className="mt-5 rounded-[1.2rem] border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-[var(--color-ink)]">Base analítica desta rodada</p>
              <p className="text-xs text-[var(--color-muted)]">
                As teses abaixo devem ser validadas à luz do risco adverso, da diretriz estratégica e dos limites do caso.
              </p>
            </div>
            <StatusBadge
              label={`risco ${dossie.analiseAdversa.nivelRiscoGeral}`}
              variant={
                dossie.analiseAdversa.nivelRiscoGeral === "alto"
                  ? "alerta"
                  : dossie.analiseAdversa.nivelRiscoGeral === "medio"
                    ? "implantacao"
                    : dossie.analiseAdversa.nivelRiscoGeral === "baixo"
                      ? "sucesso"
                      : "neutro"
              }
            />
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-muted-strong)]">
                Argumentos adversos previstos
              </p>
              <ul className="mt-2 space-y-1 text-sm text-[var(--color-muted)]">
                {dossie.analiseAdversa.argumentosAdversos.length > 0 ? (
                  dossie.analiseAdversa.argumentosAdversos.slice(0, compact ? 2 : 3).map((item) => (
                    <li key={item}>• {item}</li>
                  ))
                ) : (
                  <li>• Sem argumentos adversos detalhados nesta versão.</li>
                )}
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-muted-strong)]">
                Diretriz estratégica
              </p>
              <p className="mt-2 text-sm text-[var(--color-muted)]">
                {dossie.diagnosticoEstrategico.diretrizPrincipal || "Sem diretriz estratégica consolidada."}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-muted-strong)]">
                Pontos a evitar
              </p>
              <ul className="mt-2 space-y-1 text-sm text-[var(--color-muted)]">
                {(dossie.diagnosticoEstrategico.pontosAEvitar?.length ?? 0) > 0 ? (
                  dossie.diagnosticoEstrategico.pontosAEvitar?.slice(0, compact ? 2 : 3).map((item) => (
                    <li key={item}>• {item}</li>
                  ))
                ) : (
                  <li>• Sem restrições estratégicas detalhadas nesta versão.</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      ) : null}

      {!contextoAtual ? null : (
        <div className="mt-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-[var(--color-ink)]">Teses em análise</p>
              <p className="text-xs text-[var(--color-muted)]">
                Aprove, ajuste, rejeite ou acrescente tese manual depois de confrontar a tese com o diagnóstico do caso.
              </p>
            </div>
            <button
              type="button"
              onClick={abrirNovaTeseManual}
              className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-2 text-sm font-semibold text-[var(--color-ink)]"
            >
              Adicionar tese manual
            </button>
          </div>

          <div className="space-y-3">
            {contextoAtual.teses.length === 0 ? (
              <p className="text-sm text-[var(--color-muted)]">Nenhuma tese foi gerada para este pedido até o momento.</p>
            ) : (
              contextoAtual.teses.map((tese) => (
                <article key={tese.id} className="rounded-[1.2rem] border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-[var(--color-ink)]">{tese.titulo}</p>
                      <p className="mt-1 text-sm text-[var(--color-muted)]">{tese.descricao}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <StatusBadge label={tese.origem === "ia" ? "inferida" : "manual"} variant="neutro" />
                      <StatusBadge label={STATUS_LABEL[tese.statusValidacao]} variant={STATUS_VARIANT[tese.statusValidacao]} />
                    </div>
                  </div>

                  <div className="mt-3 space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-muted-strong)]">
                      Fundamentos associados
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {tese.fundamentos.map((fundamento) => (
                        <span
                          key={`${tese.id}-${fundamento}`}
                          className="rounded-full border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-1 text-xs text-[var(--color-muted)]"
                        >
                          {fundamento}
                        </span>
                      ))}
                    </div>
                  </div>

                  {tese.observacoesHumanas ? (
                    <p className="mt-3 text-xs text-[var(--color-muted)]">
                      <strong>Observação humana:</strong> {tese.observacoesHumanas}
                    </p>
                  ) : null}

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        registrarTese({
                          teseId: tese.id,
                          origem: tese.origem,
                          titulo: tese.titulo,
                          descricao: tese.descricao,
                          fundamentos: tese.fundamentos,
                          observacoesHumanas: tese.observacoesHumanas,
                          statusValidacao: "aprovada",
                        })
                      }
                      disabled={loading}
                      className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
                    >
                      Aprovar tese
                    </button>
                    <button
                      type="button"
                      onClick={() => abrirEditorTese(tese)}
                      disabled={loading}
                      className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-xs font-semibold text-[var(--color-ink)] disabled:opacity-50"
                    >
                      Ajustar tese
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        registrarTese({
                          teseId: tese.id,
                          origem: tese.origem,
                          titulo: tese.titulo,
                          descricao: tese.descricao,
                          fundamentos: tese.fundamentos,
                          observacoesHumanas: tese.observacoesHumanas,
                          statusValidacao: "rejeitada",
                        })
                      }
                      disabled={loading}
                      className="rounded-xl bg-rose-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
                    >
                      Rejeitar
                    </button>
                  </div>

                  {editorAberto === tese.id ? (
                    <div className="mt-4 rounded-[1.1rem] border border-[var(--color-border)] bg-[var(--color-card)] p-4">
                      <div className="grid gap-3 md:grid-cols-2">
                        <TextInput
                          label="Título da tese"
                          value={form.titulo}
                          onChange={(event) => setForm((prev) => ({ ...prev, titulo: event.target.value }))}
                        />
                        <TextareaInput
                          label="Observações humanas"
                          rows={3}
                          value={form.observacoesHumanas}
                          onChange={(event) => setForm((prev) => ({ ...prev, observacoesHumanas: event.target.value }))}
                          helperText="Registre ressalvas, recortes fáticos ou limites da tese."
                        />
                      </div>
                      <div className="mt-3 grid gap-3">
                        <TextareaInput
                          label="Formulação da tese"
                          rows={4}
                          value={form.descricao}
                          onChange={(event) => setForm((prev) => ({ ...prev, descricao: event.target.value }))}
                        />
                        <TextareaInput
                          label="Fundamentos"
                          rows={4}
                          value={form.fundamentos}
                          onChange={(event) => setForm((prev) => ({ ...prev, fundamentos: event.target.value }))}
                          helperText="Use uma linha por fundamento ou prova crítica."
                        />
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={salvarEdicaoComoAjustada}
                          disabled={loading}
                          className="rounded-xl bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                        >
                          Salvar ajuste
                        </button>
                        <button
                          type="button"
                          onClick={fecharEditor}
                          disabled={loading}
                          className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-4 py-2 text-sm font-semibold text-[var(--color-ink)]"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : null}
                </article>
              ))
            )}
          </div>

          {editorAberto === "manual" ? (
            <div className="rounded-[1.2rem] border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-4">
              <p className="text-sm font-semibold text-[var(--color-ink)]">Nova tese manual</p>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <TextInput
                  label="Título da tese"
                  value={form.titulo}
                  onChange={(event) => setForm((prev) => ({ ...prev, titulo: event.target.value }))}
                />
                <TextareaInput
                  label="Observações humanas"
                  rows={3}
                  value={form.observacoesHumanas}
                  onChange={(event) => setForm((prev) => ({ ...prev, observacoesHumanas: event.target.value }))}
                  helperText="Explique quando essa tese deve prevalecer ou ser usada como subsidiária."
                />
              </div>
              <div className="mt-3 grid gap-3">
                <TextareaInput
                  label="Formulação da tese"
                  rows={4}
                  value={form.descricao}
                  onChange={(event) => setForm((prev) => ({ ...prev, descricao: event.target.value }))}
                />
                <TextareaInput
                  label="Fundamentos"
                  rows={4}
                  value={form.fundamentos}
                  onChange={(event) => setForm((prev) => ({ ...prev, fundamentos: event.target.value }))}
                  helperText="Liste base normativa, precedente, fato crítico ou prova relevante em linhas separadas."
                />
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={salvarEdicaoComoAjustada}
                  disabled={loading}
                  className="rounded-xl bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                >
                  Salvar tese manual
                </button>
                <button
                  type="button"
                  onClick={fecharEditor}
                  disabled={loading}
                  className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-2 text-sm font-semibold text-[var(--color-ink)]"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : null}

          {!compact && tesesConfirmadas.length > 0 ? (
            <div className="rounded-[1.2rem] border border-[var(--color-border)] bg-[var(--color-card)] p-4">
              <p className="text-sm font-semibold text-[var(--color-ink)]">Teses já confirmadas</p>
              <div className="mt-3 space-y-2">
                {tesesConfirmadas.map((tese) => (
                  <div key={`confirmada-${tese.id}`} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-[var(--color-ink)]">{tese.titulo}</p>
                      <StatusBadge label={STATUS_LABEL[tese.statusValidacao]} variant={STATUS_VARIANT[tese.statusValidacao]} />
                    </div>
                    <p className="mt-1 text-xs text-[var(--color-muted)]">{tese.descricao}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      )}
    </Card>
  );
}
