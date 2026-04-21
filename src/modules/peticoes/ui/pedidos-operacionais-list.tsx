"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { SelectInput } from "@/components/ui/select-input";
import { StatusBadge } from "@/components/ui/status-badge";
import { TextInput } from "@/components/ui/text-input";
import { SearchIcon } from "@/components/ui/icons";
import type { PedidoDePeca, PrioridadePedido, StatusPedido } from "@/modules/peticoes/domain/types";
import {
  avaliarSlaDaEtapa,
  calcularDiasRestantesPrazo,
  responsavelObrigatorioAtendido,
} from "@/modules/peticoes/application/governanca-pedido";
import { formatarData } from "@/lib/utils";

type PedidosOperacionaisListProps = {
  pedidos: PedidoDePeca[];
};

type FiltroPrazo = "todos" | "vencidos" | "hoje" | "3_dias" | "7_dias";
type FiltroSla = "todos" | "ok" | "atencao" | "estourado";

const STATUS_VARIANT: Record<StatusPedido, "ativo" | "implantacao" | "planejado" | "sucesso" | "alerta" | "neutro"> = {
  "em triagem": "neutro",
  "em produção": "implantacao",
  "em revisão": "alerta",
  aprovado: "sucesso",
};

const PRIORIDADE_VARIANT: Record<PrioridadePedido, "ativo" | "implantacao" | "planejado" | "sucesso" | "alerta" | "neutro"> = {
  alta: "alerta",
  "média": "implantacao",
  baixa: "neutro",
};

function classificarPrazo(
  diasRestantes: number,
): { label: string; variant: "sucesso" | "alerta" | "neutro" | "implantacao" } {
  if (diasRestantes < 0) {
    return { label: `vencido há ${Math.abs(diasRestantes)} dia(s)`, variant: "alerta" };
  }

  if (diasRestantes === 0) {
    return { label: "vence hoje", variant: "alerta" };
  }

  if (diasRestantes <= 3) {
    return { label: `vence em ${diasRestantes} dia(s)`, variant: "implantacao" };
  }

  return { label: `vence em ${diasRestantes} dia(s)`, variant: "sucesso" };
}

export function PedidosOperacionaisList({ pedidos }: PedidosOperacionaisListProps) {
  const [busca, setBusca] = useState("");
  const [status, setStatus] = useState<StatusPedido | "todos">("todos");
  const [prioridade, setPrioridade] = useState<PrioridadePedido | "todos">("todos");
  const [responsavel, setResponsavel] = useState<string>("todos");
  const [filtroPrazo, setFiltroPrazo] = useState<FiltroPrazo>("todos");
  const [filtroSla, setFiltroSla] = useState<FiltroSla>("todos");

  const responsaveis = useMemo(
    () => Array.from(new Set(pedidos.map((pedido) => pedido.responsavel).filter(Boolean))).sort((a, b) => a.localeCompare(b)),
    [pedidos],
  );

  const pedidosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    return pedidos.filter((pedido) => {
      const diasRestantes = calcularDiasRestantesPrazo(pedido.prazoFinal);
      const sla = avaliarSlaDaEtapa({
        etapa: pedido.etapaAtual,
        pedidoCriadoEm: pedido.criadoEm,
      });

      if (status !== "todos" && pedido.status !== status) return false;
      if (prioridade !== "todos" && pedido.prioridade !== prioridade) return false;
      if (responsavel !== "todos" && pedido.responsavel !== responsavel) return false;
      if (filtroSla !== "todos" && sla.status !== filtroSla) return false;

      if (filtroPrazo === "vencidos" && diasRestantes >= 0) return false;
      if (filtroPrazo === "hoje" && diasRestantes !== 0) return false;
      if (filtroPrazo === "3_dias" && (diasRestantes < 0 || diasRestantes > 3)) return false;
      if (filtroPrazo === "7_dias" && (diasRestantes < 0 || diasRestantes > 7)) return false;

      if (!termo) return true;

      const camposBusca = [
        pedido.id,
        pedido.titulo,
        pedido.casoId,
        pedido.tipoPeca,
        pedido.status,
        pedido.prioridade,
        pedido.responsavel,
      ]
        .join(" ")
        .toLowerCase();

      return camposBusca.includes(termo);
    });
  }, [busca, filtroPrazo, filtroSla, pedidos, prioridade, responsavel, status]);

  const totais = useMemo(() => {
    const vencendoEm3Dias = pedidos.filter((pedido) => {
      const dias = calcularDiasRestantesPrazo(pedido.prazoFinal);
      return dias >= 0 && dias <= 3;
    }).length;

    const vencidos = pedidos.filter((pedido) => calcularDiasRestantesPrazo(pedido.prazoFinal) < 0).length;
    const semResponsavel = pedidos.filter((pedido) => !responsavelObrigatorioAtendido(pedido.responsavel)).length;
    const slaEstourado = pedidos.filter((pedido) =>
      avaliarSlaDaEtapa({ etapa: pedido.etapaAtual, pedidoCriadoEm: pedido.criadoEm }).status === "estourado",
    ).length;

    return {
      total: pedidos.length,
      triagem: pedidos.filter((pedido) => pedido.status === "em triagem").length,
      revisao: pedidos.filter((pedido) => pedido.status === "em revisão").length,
      vencendoEm3Dias,
      vencidos,
      semResponsavel,
      slaEstourado,
    };
  }, [pedidos]);

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-7">
        <Card className="xl:col-span-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-muted-strong)]">Total</p>
          <p className="font-serif text-4xl text-[var(--color-ink)]">{totais.total}</p>
        </Card>
        <Card className="xl:col-span-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-muted-strong)]">Em triagem</p>
          <p className="font-serif text-4xl text-[var(--color-ink)]">{totais.triagem}</p>
        </Card>
        <Card className="xl:col-span-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-muted-strong)]">Em revisão</p>
          <p className="font-serif text-4xl text-[var(--color-ink)]">{totais.revisao}</p>
        </Card>
        <Card className="xl:col-span-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-muted-strong)]">Vencendo em 3 dias</p>
          <p className="font-serif text-4xl text-[var(--color-ink)]">{totais.vencendoEm3Dias}</p>
        </Card>
        <Card className="xl:col-span-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-muted-strong)]">Vencidos</p>
          <p className="font-serif text-4xl text-[var(--color-ink)]">{totais.vencidos}</p>
        </Card>
        <Card className="xl:col-span-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-muted-strong)]">SLA estourado</p>
          <p className="font-serif text-4xl text-[var(--color-ink)]">{totais.slaEstourado}</p>
        </Card>
        <Card className="xl:col-span-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-muted-strong)]">Sem responsável</p>
          <p className="font-serif text-4xl text-[var(--color-ink)]">{totais.semResponsavel}</p>
        </Card>
      </div>

      <Card title="Busca e filtros operacionais" subtitle="Refine por status, prioridade, prazo e responsável para trabalhar por fila real.">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <TextInput
            label="Busca"
            value={busca}
            onChange={(event) => setBusca(event.target.value)}
            placeholder="ID, título, caso, tipo de peça ou responsável"
            helperText="Busca textual em campos operacionais do pedido."
          />

          <SelectInput
            label="Status"
            value={status}
            onChange={(event) => setStatus(event.target.value as StatusPedido | "todos")}
            options={[
              { value: "todos", label: "Todos" },
              { value: "em triagem", label: "Em triagem" },
              { value: "em produção", label: "Em produção" },
              { value: "em revisão", label: "Em revisão" },
              { value: "aprovado", label: "Aprovado" },
            ]}
          />

          <SelectInput
            label="Prioridade"
            value={prioridade}
            onChange={(event) => setPrioridade(event.target.value as PrioridadePedido | "todos")}
            options={[
              { value: "todos", label: "Todas" },
              { value: "alta", label: "Alta" },
              { value: "média", label: "Média" },
              { value: "baixa", label: "Baixa" },
            ]}
          />

          <SelectInput
            label="Prazo"
            value={filtroPrazo}
            onChange={(event) => setFiltroPrazo(event.target.value as FiltroPrazo)}
            options={[
              { value: "todos", label: "Todos os prazos" },
              { value: "vencidos", label: "Apenas vencidos" },
              { value: "hoje", label: "Vencem hoje" },
              { value: "3_dias", label: "Vencem em até 3 dias" },
              { value: "7_dias", label: "Vencem em até 7 dias" },
            ]}
          />

          <SelectInput
            label="Responsável"
            value={responsavel}
            onChange={(event) => setResponsavel(event.target.value)}
            options={[
              { value: "todos", label: "Todos" },
              ...responsaveis.map((item) => ({ value: item, label: item })),
            ]}
          />

          <SelectInput
            label="SLA da etapa"
            value={filtroSla}
            onChange={(event) => setFiltroSla(event.target.value as FiltroSla)}
            options={[
              { value: "todos", label: "Todos" },
              { value: "ok", label: "Dentro do SLA" },
              { value: "atencao", label: "Em atenção" },
              { value: "estourado", label: "Estourado" },
            ]}
          />
        </div>
      </Card>

      <Card
        title="Fila de pedidos"
        subtitle={`${pedidosFiltrados.length} de ${pedidos.length} pedidos visíveis com os filtros atuais.`}
      >
        {pedidosFiltrados.length === 0 ? (
          <EmptyState
            title="Nenhum pedido encontrado"
            message="Ajuste os filtros ou limpe a busca para visualizar outros pedidos da fila."
            icon={<SearchIcon size={22} />}
          />
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {pedidosFiltrados.map((pedido) => {
              const diasRestantes = calcularDiasRestantesPrazo(pedido.prazoFinal);
              const prazo = classificarPrazo(diasRestantes);
              const sla = avaliarSlaDaEtapa({ etapa: pedido.etapaAtual, pedidoCriadoEm: pedido.criadoEm });
              const responsavelDefinido = responsavelObrigatorioAtendido(pedido.responsavel);
              const badgeSla =
                sla.status === "estourado"
                  ? { label: "SLA estourado", variant: "alerta" as const }
                  : sla.status === "atencao"
                    ? { label: "SLA em atenção", variant: "implantacao" as const }
                    : { label: "SLA dentro", variant: "sucesso" as const };

              return (
                <article
                  key={pedido.id}
                  className="rounded-[1.25rem] border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-[var(--color-ink)]">{pedido.id}</p>
                      <p className="mt-1 text-sm text-[var(--color-muted)]">{pedido.titulo}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <StatusBadge label={pedido.status} variant={STATUS_VARIANT[pedido.status]} />
                      <StatusBadge label={pedido.prioridade} variant={PRIORIDADE_VARIANT[pedido.prioridade]} />
                    </div>
                  </div>

                  <div className="mt-4 grid gap-2 text-xs text-[var(--color-muted)] sm:grid-cols-2">
                    <p>
                      <strong className="text-[var(--color-muted-strong)]">Caso:</strong> {pedido.casoId}
                    </p>
                    <p>
                      <strong className="text-[var(--color-muted-strong)]">Etapa:</strong> {pedido.etapaAtual.replaceAll("_", " ")}
                    </p>
                    <p>
                      <strong className="text-[var(--color-muted-strong)]">Responsável:</strong> {pedido.responsavel}
                    </p>
                    <p>
                      <strong className="text-[var(--color-muted-strong)]">Prazo:</strong> {formatarData(pedido.prazoFinal)}
                    </p>
                  </div>

                  <div className="mt-3">
                    <StatusBadge label={prazo.label} variant={prazo.variant} />
                    <div className="mt-2">
                      <StatusBadge label={`${badgeSla.label} • ${sla.diasConsumidos}/${sla.diasSla} dias`} variant={badgeSla.variant} />
                    </div>
                    {!responsavelDefinido ? (
                      <p className="mt-2 text-xs font-semibold text-rose-700">
                        Responsável obrigatório pendente: execução e aprovação ficam bloqueadas.
                      </p>
                    ) : null}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-3">
                    <Link href={`/peticoes/pedidos/${pedido.id}`} className="text-sm font-semibold text-[var(--color-accent)]">
                      Abrir detalhe
                    </Link>
                    <Link href={`/peticoes/pipeline/${pedido.id}`} className="text-sm font-semibold text-[var(--color-accent)]">
                      Abrir pipeline
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
