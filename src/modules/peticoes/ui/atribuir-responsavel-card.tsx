"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { InlineAlert } from "@/components/ui/inline-alert";

type AtribuirResponsavelCardProps = {
  pedidoId: string;
  responsavelAtual: string;
};

export function AtribuirResponsavelCard({
  pedidoId,
  responsavelAtual,
}: AtribuirResponsavelCardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [responsavel, setResponsavel] = useState(responsavelAtual === "Distribuição automática" ? "" : responsavelAtual);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);

  async function salvarResponsavel() {
    const valor = responsavel.trim();
    setErro(null);
    setSucesso(null);

    if (!valor) {
      setErro("Informe o nome do responsável para liberar execução e aprovação.");
      return;
    }

    const response = await fetch(`/api/peticoes/${pedidoId}/responsavel`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ responsavel: valor }),
    });

    const data = (await response.json()) as { error?: string };
    if (!response.ok) {
      setErro(data.error ?? "Não foi possível atualizar o responsável.");
      return;
    }

    setSucesso("Responsável atualizado com sucesso.");
    startTransition(() => router.refresh());
  }

  return (
    <Card
      title="Responsável obrigatório"
      subtitle="Sem responsável definido, a execução e a aprovação do pipeline ficam bloqueadas."
      eyebrow="Governança"
    >
      <div className="space-y-3">
        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-muted-strong)]">
            Responsável titular
          </span>
          <input
            value={responsavel}
            onChange={(event) => setResponsavel(event.target.value)}
            placeholder="Nome do advogado responsável"
            className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-3 py-2 text-sm text-[var(--color-ink)] outline-none"
          />
        </label>

        <button
          type="button"
          onClick={salvarResponsavel}
          disabled={isPending}
          className="rounded-xl bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {isPending ? "Atualizando..." : "Salvar responsável"}
        </button>

        {erro ? (
          <InlineAlert title="Falha ao atualizar" variant="warning">
            {erro}
          </InlineAlert>
        ) : null}

        {sucesso ? (
          <InlineAlert title="Atualização concluída" variant="success">
            {sucesso}
          </InlineAlert>
        ) : null}
      </div>
    </Card>
  );
}
