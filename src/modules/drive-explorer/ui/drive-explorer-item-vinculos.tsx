"use client";

import { useMemo, useState, useTransition } from "react";
import { InlineAlert } from "@/components/ui/inline-alert";
import { SelectInput } from "@/components/ui/select-input";
import type { DriveExplorerVinculo } from "@/modules/drive-explorer/domain/types";

type Opcao = { id: string; label: string };

type Props = {
  driveFileId: string;
  driveFileName: string;
  driveMimeType?: string;
  driveWebViewLink?: string;
  vinculosIniciais: DriveExplorerVinculo[];
  opcoes: {
    casos: Opcao[];
    pedidos: Opcao[];
    clientes: Opcao[];
  };
};

function obterLista(tipo: "caso" | "pedido" | "cliente", opcoes: Props["opcoes"]) {
  if (tipo === "caso") return opcoes.casos;
  if (tipo === "pedido") return opcoes.pedidos;
  return opcoes.clientes;
}

export function DriveExplorerItemVinculos({
  driveFileId,
  driveFileName,
  driveMimeType,
  driveWebViewLink,
  vinculosIniciais,
  opcoes,
}: Props) {
  const [tipoEntidade, setTipoEntidade] = useState<"caso" | "pedido" | "cliente">("caso");
  const [entidadeId, setEntidadeId] = useState("");
  const [vinculos, setVinculos] = useState(vinculosIniciais);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, startSaving] = useTransition();

  const opcoesAtual = useMemo(() => obterLista(tipoEntidade, opcoes), [opcoes, tipoEntidade]);

  function vincular() {
    if (!entidadeId) return;
    setMensagem(null);
    setErro(null);
    startSaving(async () => {
      const entidadeLabel = opcoesAtual.find((item) => item.id === entidadeId)?.label;
      const res = await fetch("/api/documentos/drive/vinculos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          driveFileId,
          driveFileName,
          driveMimeType,
          driveWebViewLink,
          tipoEntidade,
          entidadeId,
          entidadeLabel,
        }),
      });
      const payload = (await res.json()) as { error?: string; vinculo?: DriveExplorerVinculo };
      if (!res.ok || !payload.vinculo) {
        setErro(payload.error ?? "Falha ao salvar vínculo.");
        return;
      }
      setVinculos((atual) => {
        if (atual.some((item) => item.id === payload.vinculo?.id)) return atual;
        return [payload.vinculo!, ...atual];
      });
      setMensagem("Arquivo vinculado ao fluxo operacional.");
      setEntidadeId("");
    });
  }

  return (
    <div className="mt-4 space-y-3 rounded-[1.1rem] border border-[var(--color-border)] bg-[var(--color-card)] p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-muted-strong)]">
          Vínculo operacional
        </p>
      </div>

      {vinculos.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {vinculos.map((vinculo) => (
            <span
              key={vinculo.id}
              className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-3 py-1 text-xs font-medium text-[var(--color-ink)]"
            >
              {vinculo.entidadeLabel}
            </span>
          ))}
        </div>
      ) : (
        <p className="text-xs text-[var(--color-muted)]">
          Ainda sem vínculo com caso, pedido ou cliente.
        </p>
      )}

      <div className="grid gap-3 md:grid-cols-2">
        <SelectInput
          label="Tipo de vínculo"
          value={tipoEntidade}
          onChange={(event) => {
            const novoTipo = event.target.value as "caso" | "pedido" | "cliente";
            setTipoEntidade(novoTipo);
            setEntidadeId("");
          }}
          options={[
            { value: "caso", label: "Caso" },
            { value: "pedido", label: "Pedido" },
            { value: "cliente", label: "Cliente" },
          ]}
        />
        <SelectInput
          label="Registro"
          value={entidadeId}
          onChange={(event) => setEntidadeId(event.target.value)}
          options={[
            { value: "", label: "Selecione um registro" },
            ...opcoesAtual.map((item) => ({ value: item.id, label: item.label })),
          ]}
        />
      </div>

      {mensagem ? (
        <InlineAlert title="Vínculo salvo" variant="success">
          {mensagem}
        </InlineAlert>
      ) : null}
      {erro ? (
        <InlineAlert title="Falha no vínculo" variant="warning">
          {erro}
        </InlineAlert>
      ) : null}

      <button
        type="button"
        onClick={vincular}
        disabled={salvando || !entidadeId}
        className="rounded-xl border border-[var(--color-border)] px-3 py-1.5 text-xs font-semibold text-[var(--color-ink)] transition hover:bg-[var(--color-surface-alt)] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {salvando ? "Vinculando..." : "Vincular arquivo"}
      </button>
    </div>
  );
}
