import { cn } from "@/lib/utils";
import type { EtapaNovoPedidoWizard } from "@/modules/peticoes/novo-pedido/domain/types";

const ETAPAS: Array<{ id: EtapaNovoPedidoWizard; titulo: string; resumo: string }> = [
  {
    id: "caso_contexto",
    titulo: "Caso e contexto",
    resumo: "Base jurídica do pedido",
  },
  {
    id: "objetivo_juridico",
    titulo: "Objetivo jurídico",
    resumo: "Direção do trabalho",
  },
  {
    id: "estrategia_inicial",
    titulo: "Estratégia inicial",
    resumo: "Sugestões e ajustes",
  },
  {
    id: "documentos_provas",
    titulo: "Documentos e provas",
    resumo: "Material de apoio",
  },
  {
    id: "revisao_criacao",
    titulo: "Revisão e criação",
    resumo: "Confirmação humana",
  },
];

type WizardStepperProps = {
  etapaAtual: EtapaNovoPedidoWizard;
  onSelecionarEtapa: (etapa: EtapaNovoPedidoWizard) => void;
};

export function WizardStepper({ etapaAtual, onSelecionarEtapa }: WizardStepperProps) {
  const etapaAtualIndex = ETAPAS.findIndex((etapa) => etapa.id === etapaAtual);

  return (
    <div className="grid gap-3 lg:grid-cols-5">
      {ETAPAS.map((etapa, index) => {
        const ativa = etapa.id === etapaAtual;
        const concluida = index < etapaAtualIndex;
        const habilitada = index <= etapaAtualIndex;

        return (
          <button
            key={etapa.id}
            type="button"
            onClick={() => {
              if (habilitada) {
                onSelecionarEtapa(etapa.id);
              }
            }}
            disabled={!habilitada}
            className={cn(
              "rounded-2xl border p-4 text-left transition",
              ativa
                ? "border-[var(--color-accent)] bg-[var(--color-card)] shadow-sm"
                : "border-[var(--color-border)] bg-[var(--color-surface-alt)]",
              habilitada ? "hover:bg-[var(--color-card)]" : "cursor-not-allowed opacity-60",
            )}
          >
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  "grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-bold",
                  ativa
                    ? "bg-[var(--color-accent)] text-white"
                    : concluida
                      ? "bg-emerald-600 text-white"
                      : "bg-[var(--color-page)] text-[var(--color-muted)]",
                )}
              >
                {concluida ? "OK" : index + 1}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[var(--color-ink)]">{etapa.titulo}</p>
                <p className="text-xs text-[var(--color-muted)]">{etapa.resumo}</p>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
