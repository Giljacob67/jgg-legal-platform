import { Card } from "@/components/ui/card";
import { InlineAlert } from "@/components/ui/inline-alert";
import { StatusBadge } from "@/components/ui/status-badge";
import type { ProntidaoAprovacao } from "@/modules/peticoes/application/avaliarProntidaoAprovacao";

type AuditoriaAprovacaoPanelProps = {
  prontidao: ProntidaoAprovacao;
  compact?: boolean;
};

function variantForStatus(status: "ok" | "atencao" | "bloqueado") {
  if (status === "ok") return "sucesso" as const;
  if (status === "atencao") return "implantacao" as const;
  return "alerta" as const;
}

function labelForStatus(status: "ok" | "atencao" | "bloqueado") {
  if (status === "ok") return "ok";
  if (status === "atencao") return "atenção";
  return "bloqueado";
}

export function AuditoriaAprovacaoPanel({
  prontidao,
  compact = false,
}: AuditoriaAprovacaoPanelProps) {
  return (
    <Card
      title="Auditoria de aprovação"
      subtitle="Checklist jurídico-operacional antes do fechamento formal da peça."
      eyebrow="Revisão"
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-[var(--color-muted)]">{prontidao.resumo}</p>
          <StatusBadge
            label={prontidao.liberado ? "pronto para aprovar" : "ainda bloqueado"}
            variant={prontidao.liberado ? "sucesso" : "alerta"}
          />
        </div>

        {prontidao.bloqueios.length > 0 ? (
          <InlineAlert title="Bloqueios de aprovação" variant="warning">
            {prontidao.bloqueios.join(" • ")}
          </InlineAlert>
        ) : (
          <InlineAlert title="Checklist mínimo atendido" variant="success">
            A peça já superou o mínimo jurídico-operacional para decisão final.
          </InlineAlert>
        )}

        <div className="grid gap-3 md:grid-cols-2">
          {prontidao.itens.slice(0, compact ? 6 : prontidao.itens.length).map((item) => (
            <article
              key={item.id}
              className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-3"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold text-[var(--color-ink)]">{item.label}</p>
                <StatusBadge label={labelForStatus(item.status)} variant={variantForStatus(item.status)} />
              </div>
              <p className="mt-2 text-xs text-[var(--color-muted)]">{item.detalhe}</p>
            </article>
          ))}
        </div>
      </div>
    </Card>
  );
}
