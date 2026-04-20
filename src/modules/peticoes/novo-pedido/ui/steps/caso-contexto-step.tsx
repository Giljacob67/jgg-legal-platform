import type { Caso } from "@/modules/casos/domain/types";
import { SelectInput } from "@/components/ui/select-input";
import { TextareaInput } from "@/components/ui/textarea-input";
import { StatusBadge } from "@/components/ui/status-badge";
import type { BriefingNovoPedido } from "@/modules/peticoes/novo-pedido/domain/types";

type CasoContextoStepProps = {
  casos: Caso[];
  briefing: BriefingNovoPedido;
  onSelecionarCaso: (casoId: string) => void;
  onAtualizarBriefing: (campo: "contextoFatico" | "observacoesOperacionais", valor: string) => void;
};

export function CasoContextoStep({
  casos,
  briefing,
  onSelecionarCaso,
  onAtualizarBriefing,
}: CasoContextoStepProps) {
  const casoSelecionado = casos.find((caso) => caso.id === briefing.casoId) ?? null;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-[1.2fr,0.8fr]">
        <SelectInput
          label="Caso jurídico"
          value={briefing.casoId}
          options={casos.map((caso) => ({
            value: caso.id,
            label: `${caso.id} — ${caso.titulo}`,
          }))}
          helperText="Selecione o caso-matriz para importar cliente, matéria, tribunal e prazo base."
          requiredMark
          onChange={(event) => onSelecionarCaso(event.target.value)}
        />

        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">
            Leitura automática do caso
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <StatusBadge
              label={
                briefing.poloInferido === "ativo"
                  ? "Polo ativo inferido"
                  : briefing.poloInferido === "passivo"
                    ? "Polo passivo inferido"
                    : "Polo indefinido"
              }
              variant={briefing.poloInferido === "indefinido" ? "alerta" : "sucesso"}
            />
            {casoSelecionado?.prazoFinal ? (
              <StatusBadge label={`Prazo ${casoSelecionado.prazoFinal}`} variant="neutro" />
            ) : (
              <StatusBadge label="Prazo não informado" variant="alerta" />
            )}
          </div>
          <p className="mt-3 text-sm text-[var(--color-muted)]">
            O wizard usa o caso como base, mas a confirmação final continua humana.
          </p>
        </div>
      </div>

      {casoSelecionado ? (
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">Cliente</p>
            <p className="mt-2 text-sm font-semibold text-[var(--color-ink)]">{casoSelecionado.cliente}</p>
          </div>
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">Matéria</p>
            <p className="mt-2 text-sm font-semibold text-[var(--color-ink)]">{casoSelecionado.materia}</p>
          </div>
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">Tribunal</p>
            <p className="mt-2 text-sm font-semibold text-[var(--color-ink)]">
              {casoSelecionado.tribunal || "Não informado"}
            </p>
          </div>
        </div>
      ) : null}

      <TextareaInput
        label="Contexto do pedido"
        value={briefing.contextoFatico}
        onChange={(event) => onAtualizarBriefing("contextoFatico", event.target.value)}
        placeholder="Descreva, em linguagem de trabalho jurídico, o que chegou ao escritório, o que aconteceu e qual é o ponto central do pedido."
        helperText="Registre o cenário recebido, a situação processual e o resultado que precisa ser produzido."
        requiredMark
      />

      <TextareaInput
        label="Observações operacionais e lacunas"
        value={briefing.observacoesOperacionais}
        onChange={(event) => onAtualizarBriefing("observacoesOperacionais", event.target.value)}
        placeholder="Ex.: falta procuração atualizada, cliente prometeu enviar a planilha de cálculo, há urgência por audiência ou protocolo."
        helperText="Use este campo para dependências, lacunas probatórias e condicionantes operacionais."
      />
    </div>
  );
}
