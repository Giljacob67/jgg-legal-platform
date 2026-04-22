import { SelectInput } from "@/components/ui/select-input";
import { StatusBadge } from "@/components/ui/status-badge";
import { TextInput } from "@/components/ui/text-input";
import { TextareaInput } from "@/components/ui/textarea-input";
import type { PrioridadePedido, TipoPeca } from "@/modules/peticoes/domain/types";
import type {
  EstrategiaInicialNovoPedido,
  SugestaoTriagemWizard,
  TesePreliminarNovoPedido,
} from "@/modules/peticoes/novo-pedido/domain/types";

type EstrategiaInicialStepProps = {
  estrategia: EstrategiaInicialNovoPedido;
  teses: TesePreliminarNovoPedido[];
  tiposPeca: TipoPeca[];
  triagem: SugestaoTriagemWizard | null;
  carregandoTriagem: boolean;
  erroTriagem: string | null;
  onAtualizarTriagem: () => void;
  onConfirmarTipoPeca: (tipoPeca: TipoPeca) => void;
  onConfirmarPrioridade: (prioridade: PrioridadePedido) => void;
  onAtualizarTese: (teseId: string, atualizacao: Partial<TesePreliminarNovoPedido>) => void;
  onAdicionarTeseManual: () => void;
  onRemoverTeseManual: (teseId: string) => void;
};

export function EstrategiaInicialStep({
  estrategia,
  teses,
  tiposPeca,
  triagem,
  carregandoTriagem,
  erroTriagem,
  onAtualizarTriagem,
  onConfirmarTipoPeca,
  onConfirmarPrioridade,
  onAtualizarTese,
  onAdicionarTeseManual,
  onRemoverTeseManual,
}: EstrategiaInicialStepProps) {
  const tesesValidadas = teses.filter((tese) => tese.statusValidacao === "aprovada" || tese.statusValidacao === "ajustada");

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-[var(--color-ink)]">Análise assistida do briefing</p>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            O sistema consolida urgência, peça provável e próximos passos. Você confirma antes de abrir o pedido.
          </p>
        </div>
        <button
          type="button"
          onClick={onAtualizarTriagem}
          disabled={carregandoTriagem}
          className="rounded-xl bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {carregandoTriagem ? "Atualizando sugestões..." : triagem ? "Atualizar sugestões" : "Gerar sugestões"}
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">Urgência</p>
          <p className="mt-2 text-lg font-semibold text-[var(--color-ink)]">{estrategia.urgencia.nivel}</p>
          <p className="mt-2 text-sm text-[var(--color-muted)]">{estrategia.urgencia.justificativa}</p>
        </div>

        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">Peça sugerida</p>
          <p className="mt-2 text-sm font-semibold text-[var(--color-ink)]">
            {estrategia.tipoPecaSugerida ?? "Ainda não inferida"}
          </p>
          {triagem?.modo ? (
            <div className="mt-3">
              <StatusBadge label={`Sugestão ${triagem.modo === "ai" ? "IA" : "mock"}`} variant="neutro" />
            </div>
          ) : null}
        </div>

        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">Prioridade sugerida</p>
          <p className="mt-2 text-lg font-semibold text-[var(--color-ink)]">{estrategia.prioridadeSugerida}</p>
          {triagem?.responsavelSugerido ? (
            <p className="mt-2 text-sm text-[var(--color-muted)]">
              Responsável sugerido: {triagem.responsavelSugerido}
            </p>
          ) : null}
        </div>

        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">Alertas</p>
          <p className="mt-2 text-lg font-semibold text-[var(--color-ink)]">{estrategia.alertas.length}</p>
          <p className="mt-2 text-sm text-[var(--color-muted)]">
            {estrategia.alertas.length > 0 ? "Há pontos de atenção antes da criação." : "Sem alertas críticos por enquanto."}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-4">
        <p className="text-sm font-semibold text-[var(--color-ink)]">O que foi inferido</p>
        <p className="mt-2 text-sm text-[var(--color-muted)]">{estrategia.resumoInferido}</p>
        {erroTriagem ? <p className="mt-3 text-sm text-rose-700">{erroTriagem}</p> : null}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <SelectInput
          label="Tipo de peça confirmado"
          value={estrategia.tipoPecaConfirmada ?? estrategia.tipoPecaSugerida ?? ""}
          options={[
            { value: "", label: "Selecione o tipo de peça" },
            ...tiposPeca.map((tipo) => ({ value: tipo, label: tipo })),
          ]}
          helperText="A sugestão do sistema pode ser ajustada. A confirmação aqui define a abertura final."
          onChange={(event) => onConfirmarTipoPeca(event.target.value as TipoPeca)}
        />

        <SelectInput
          label="Prioridade confirmada"
          value={estrategia.prioridadeConfirmada ?? estrategia.prioridadeSugerida}
          options={[
            { value: "baixa", label: "Baixa" },
            { value: "média", label: "Média" },
            { value: "alta", label: "Alta" },
          ]}
          helperText="Prioridade operacional do pedido após leitura humana do briefing."
          onChange={(event) => onConfirmarPrioridade(event.target.value as PrioridadePedido)}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-4">
          <p className="text-sm font-semibold text-[var(--color-ink)]">Próximas providências</p>
          <ul className="mt-3 space-y-2 text-sm text-[var(--color-muted)]">
            {estrategia.proximasProvidencias.map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-4">
          <p className="text-sm font-semibold text-[var(--color-ink)]">Alertas e lacunas</p>
          {estrategia.alertas.length > 0 ? (
            <ul className="mt-3 space-y-2 text-sm text-[var(--color-muted)]">
              {estrategia.alertas.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-[var(--color-muted)]">Nenhuma lacuna crítica identificada neste momento.</p>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-[var(--color-ink)]">Teses preliminares do pedido</p>
            <p className="mt-1 text-sm text-[var(--color-muted)]">
              O sistema sugere caminhos. A abertura só deve seguir com tese humana aprovada, ajustada ou manual.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusBadge label={`${teses.length} mapeada(s)`} variant="neutro" />
            <StatusBadge label={`${tesesValidadas.length} validada(s)`} variant={tesesValidadas.length > 0 ? "sucesso" : "alerta"} />
          </div>
        </div>

        <div className="mt-4 space-y-4">
          {teses.map((tese) => (
            <article key={tese.id} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap gap-2">
                  <StatusBadge label={tese.origem === "inferida" ? "inferida" : "manual"} variant="neutro" />
                  <StatusBadge label={tese.statusValidacao} variant={tese.statusValidacao === "rejeitada" ? "alerta" : tese.statusValidacao === "pendente" ? "implantacao" : "sucesso"} />
                </div>
                {tese.origem === "manual" ? (
                  <button
                    type="button"
                    onClick={() => onRemoverTeseManual(tese.id)}
                    className="text-xs font-semibold text-rose-700"
                  >
                    Remover tese
                  </button>
                ) : null}
              </div>

              <div className="mt-4 grid gap-3">
                <TextInput
                  label="Título da tese"
                  value={tese.titulo}
                  onChange={(event) => onAtualizarTese(tese.id, { titulo: event.target.value })}
                />
                <TextareaInput
                  label="Formulação da tese"
                  rows={3}
                  value={tese.descricao}
                  onChange={(event) => onAtualizarTese(tese.id, { descricao: event.target.value })}
                />
                <TextareaInput
                  label="Fundamentos e provas-chave"
                  rows={4}
                  value={tese.fundamentos.join("\n")}
                  helperText="Use uma linha por fundamento, prova ou vulnerabilidade explorada."
                  onChange={(event) =>
                    onAtualizarTese(tese.id, {
                      fundamentos: event.target.value
                        .split("\n")
                        .map((item) => item.trim())
                        .filter(Boolean),
                    })
                  }
                />
                <TextareaInput
                  label="Observações humanas"
                  rows={2}
                  value={tese.observacoesHumanas}
                  onChange={(event) => onAtualizarTese(tese.id, { observacoesHumanas: event.target.value })}
                  helperText="Registre ressalvas, limites probatórios ou quando usar essa tese."
                />
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => onAtualizarTese(tese.id, { statusValidacao: "aprovada" })}
                  className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white"
                >
                  Aprovar
                </button>
                <button
                  type="button"
                  onClick={() => onAtualizarTese(tese.id, { statusValidacao: "ajustada" })}
                  className="rounded-xl bg-[var(--color-accent)] px-3 py-2 text-xs font-semibold text-white"
                >
                  Ajustar e validar
                </button>
                <button
                  type="button"
                  onClick={() => onAtualizarTese(tese.id, { statusValidacao: "rejeitada" })}
                  className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-xs font-semibold text-[var(--color-ink)]"
                >
                  Rejeitar
                </button>
              </div>
            </article>
          ))}

          <button
            type="button"
            onClick={onAdicionarTeseManual}
            className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-2 text-sm font-semibold text-[var(--color-ink)]"
          >
            Adicionar tese manual
          </button>
        </div>
      </div>
    </div>
  );
}
