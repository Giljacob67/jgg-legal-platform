"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { PrioridadePedido, TipoPeca } from "@/modules/peticoes/domain/types";
import { simularCriacaoPedido } from "@/modules/peticoes/application/simularCriacaoPedido";
import { Card } from "@/components/ui/card";
import { SelectInput } from "@/components/ui/select-input";
import { TextInput } from "@/components/ui/text-input";
import { TextareaInput } from "@/components/ui/textarea-input";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatarDataHora } from "@/lib/utils";

type NovoPedidoFormProps = {
  tiposPeca: TipoPeca[];
  casoIdPadrao: string;
};

export function NovoPedidoForm({ tiposPeca, casoIdPadrao }: NovoPedidoFormProps) {
  const [casoId, setCasoId] = useState(casoIdPadrao);
  const [titulo, setTitulo] = useState("Pedido de peça para estratégia inicial");
  const [tipoPeca, setTipoPeca] = useState<TipoPeca>(tiposPeca[0]);
  const [prioridade, setPrioridade] = useState<PrioridadePedido>("média");
  const [prazoFinal, setPrazoFinal] = useState("2026-04-12");
  const [contexto, setContexto] = useState("Destacar fundamentos para tutela de urgência e pedidos principais.");

  const [pedidoGerado, setPedidoGerado] = useState<ReturnType<typeof simularCriacaoPedido> | null>(null);
  const [erro, setErro] = useState("");

  const opcoesTipos = useMemo(
    () => tiposPeca.map((tipo) => ({ value: tipo, label: tipo })),
    [tiposPeca],
  );

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErro("");

    try {
      const novoPedido = simularCriacaoPedido({
        casoId,
        titulo,
        tipoPeca,
        prioridade,
        prazoFinal,
      });

      setPedidoGerado(novoPedido);
    } catch (error) {
      setPedidoGerado(null);
      setErro(error instanceof Error ? error.message : "Não foi possível simular o pedido.");
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.25fr,1fr]">
      <Card title="Novo pedido de peça" subtitle="Fluxo inicial de produção jurídica com dados simulados.">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <TextInput label="ID do caso" value={casoId} onChange={(event) => setCasoId(event.target.value)} required />
            <TextInput
              label="Prazo final"
              type="date"
              value={prazoFinal}
              onChange={(event) => setPrazoFinal(event.target.value)}
              required
            />
          </div>

          <TextInput label="Título do pedido" value={titulo} onChange={(event) => setTitulo(event.target.value)} required />

          <div className="grid gap-4 md:grid-cols-2">
            <SelectInput
              label="Tipo de peça"
              value={tipoPeca}
              options={opcoesTipos}
              onChange={(event) => setTipoPeca(event.target.value as TipoPeca)}
            />

            <SelectInput
              label="Prioridade"
              value={prioridade}
              options={[
                { value: "baixa", label: "Baixa" },
                { value: "média", label: "Média" },
                { value: "alta", label: "Alta" },
              ]}
              onChange={(event) => setPrioridade(event.target.value as PrioridadePedido)}
            />
          </div>

          <TextareaInput
            label="Contexto para a equipe"
            value={contexto}
            onChange={(event) => setContexto(event.target.value)}
          />

          <button
            type="submit"
            className="rounded-xl bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--color-accent-strong)]"
          >
            Simular criação do pedido
          </button>
          {erro ? <p className="text-sm font-medium text-rose-700">{erro}</p> : null}
        </form>
      </Card>

      <Card title="Prévia do pedido" subtitle="Resultado mockado da camada de aplicação.">
        {!pedidoGerado ? (
          <p className="text-sm text-[var(--color-muted)]">
            Preencha o formulário e clique em simular para gerar um pedido de peça de exemplo.
          </p>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-[var(--color-ink)]">{pedidoGerado.id}</p>
              <StatusBadge label={pedidoGerado.status} variant="implantacao" />
            </div>
            <p className="text-sm text-[var(--color-muted)]">{pedidoGerado.titulo}</p>
            <p className="text-xs text-[var(--color-muted)]">Criado em: {formatarDataHora(pedidoGerado.criadoEm)}</p>

            <div className="flex flex-wrap gap-2 pt-2">
              <Link
                href={`/peticoes/pedidos/PED-2026-001`}
                className="rounded-xl border border-[var(--color-border)] px-3 py-1.5 text-sm font-medium text-[var(--color-ink)] hover:bg-[var(--color-surface-alt)]"
              >
                Abrir detalhe de pedido exemplo
              </Link>
              <Link
                href={`/peticoes/pipeline/PED-2026-001`}
                className="rounded-xl border border-[var(--color-border)] px-3 py-1.5 text-sm font-medium text-[var(--color-ink)] hover:bg-[var(--color-surface-alt)]"
              >
                Abrir pipeline exemplo
              </Link>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
