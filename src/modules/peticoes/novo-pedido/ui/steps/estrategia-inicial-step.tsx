import { SelectInput } from "@/components/ui/select-input";
import { StatusBadge } from "@/components/ui/status-badge";
import type { PrioridadePedido, TipoPeca } from "@/modules/peticoes/domain/types";
import type { EstrategiaInicialNovoPedido, SugestaoTriagemWizard } from "@/modules/peticoes/novo-pedido/domain/types";

type EstrategiaInicialStepProps = {
  estrategia: EstrategiaInicialNovoPedido;
  tiposPeca: TipoPeca[];
  triagem: SugestaoTriagemWizard | null;
  carregandoTriagem: boolean;
  erroTriagem: string | null;
  onAtualizarTriagem: () => void;
  onConfirmarTipoPeca: (tipoPeca: TipoPeca) => void;
  onConfirmarPrioridade: (prioridade: PrioridadePedido) => void;
};

export function EstrategiaInicialStep({
  estrategia,
  tiposPeca,
  triagem,
  carregandoTriagem,
  erroTriagem,
  onAtualizarTriagem,
  onConfirmarTipoPeca,
  onConfirmarPrioridade,
}: EstrategiaInicialStepProps) {
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
          options={tiposPeca.map((tipo) => ({ value: tipo, label: tipo }))}
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
    </div>
  );
}
