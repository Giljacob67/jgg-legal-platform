"use client";

import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { SparkIcon } from "@/components/ui/icons";

type DestaqueAssistenteProps = {
  onAbrirAssistente?: () => void;
};

export function DestaqueAssistente({ onAbrirAssistente }: DestaqueAssistenteProps) {
  return (
    <Card
      title="Assistente Jurídico"
      subtitle="Experiência principal de trabalho — conversa com a IA usando linguagem natural."
      eyebrow="Novo"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[var(--color-accent)] text-white">
            <SparkIcon size={20} />
          </div>
          <div>
            <p className="text-sm font-semibold text-[var(--color-ink)]">
              Trabalhe com a IA diretamente neste pedido
            </p>
            <p className="text-xs text-[var(--color-muted)]">
              Analise documentos, identifique a peça cabível, gere diagnóstico,
              sugira estratégia, redija minuta ou revise a peça — tudo por conversa.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <StatusBadge label="modo experimental" variant="implantacao" />
          <StatusBadge label="dados simulados" variant="neutro" />
          {onAbrirAssistente ? (
            <button
              type="button"
              onClick={onAbrirAssistente}
              className="rounded-xl bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--color-accent-strong)]"
            >
              Abrir Assistente
            </button>
          ) : null}
        </div>
      </div>
    </Card>
  );
}
