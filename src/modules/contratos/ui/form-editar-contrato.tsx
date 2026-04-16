"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type {
  Contrato,
  TipoContrato,
  StatusContrato,
  ParteContrato,
  AtualizarContratoPayload,
} from "@/modules/contratos/domain/types";
import { LABEL_TIPO_CONTRATO, LABEL_STATUS_CONTRATO } from "@/modules/contratos/domain/types";
import { Card } from "@/components/ui/card";

const TIPOS = Object.entries(LABEL_TIPO_CONTRATO) as [TipoContrato, string][];
const STATUS_EDITAVEIS: StatusContrato[] = ["rascunho", "em_revisao", "aprovado"];

interface Props {
  contrato: Contrato;
}

export function FormEditarContrato({ contrato }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [titulo, setTitulo] = useState(contrato.titulo);
  const [tipo, setTipo] = useState<TipoContrato>(contrato.tipo);
  const [objeto, setObjeto] = useState(contrato.objeto);
  const [status, setStatus] = useState<StatusContrato>(contrato.status);
  const [valorReais, setValorReais] = useState(
    contrato.valorReais ? (contrato.valorReais / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 }) : ""
  );
  const [vigenciaInicio, setVigenciaInicio] = useState(contrato.vigenciaInicio?.slice(0, 10) ?? "");
  const [vigenciaFim, setVigenciaFim] = useState(contrato.vigenciaFim?.slice(0, 10) ?? "");
  const [casoId, setCasoId] = useState(contrato.casoId ?? "");
  const [partes, setPartes] = useState<Partial<ParteContrato>[]>(
    contrato.partes.length > 0 ? contrato.partes : [{ papel: "contratante", nome: "" }, { papel: "contratado", nome: "" }]
  );

  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // ── Partes ─────────────────────────────────────────────────

  function atualizarParte(idx: number, campo: keyof ParteContrato, valor: string) {
    setPartes((prev) => prev.map((p, i) => (i === idx ? { ...p, [campo]: valor } : p)));
  }

  function adicionarParte() {
    setPartes((prev) => [...prev, { papel: "outro", nome: "" }]);
  }

  function removerParte(idx: number) {
    setPartes((prev) => prev.filter((_, i) => i !== idx));
  }

  // ── Salvar ──────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setSalvando(true);
    try {
      const payload: AtualizarContratoPayload = {};
      if (titulo !== contrato.titulo) payload.titulo = titulo;
      if (tipo !== contrato.tipo) payload.tipo = tipo;
      if (objeto !== contrato.objeto) payload.objeto = objeto;
      if (status !== contrato.status) payload.status = status;
      const novoValor = valorReais ? Math.round(parseFloat(valorReais.replace(",", ".")) * 100) : null;
      if (novoValor !== (contrato.valorReais ?? null)) payload.valorReais = novoValor;
      const novaInicio = vigenciaInicio || null;
      if (novaInicio !== (contrato.vigenciaInicio?.slice(0, 10) ?? null)) payload.vigenciaInicio = novaInicio;
      const novaFim = vigenciaFim || null;
      if (novaFim !== (contrato.vigenciaFim?.slice(0, 10) ?? null)) payload.vigenciaFim = novaFim;
      const novoCasoId = casoId || null;
      if (novoCasoId !== (contrato.casoId ?? null)) payload.casoId = novoCasoId;
      const novasPartes = partes.filter((p) => p.nome) as ParteContrato[];
      if (JSON.stringify(novasPartes) !== JSON.stringify(contrato.partes)) payload.partes = novasPartes;

      const res = await fetch(`/api/contratos/${contrato.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json() as { error?: string };
        throw new Error(data.error ?? "Erro ao salvar.");
      }
      startTransition(() => router.push(`/contratos/${contrato.id}`));
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao salvar.");
    } finally {
      setSalvando(false);
    }
  }

  // ── Excluir ─────────────────────────────────────────────────

  async function handleExcluir() {
    if (!confirm(`Excluir o contrato "${contrato.titulo}"? Esta ação não pode ser desfeita.`)) return;
    try {
      const res = await fetch(`/api/contratos/${contrato.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json() as { error?: string };
        throw new Error(data.error ?? "Erro ao excluir.");
      }
      startTransition(() => router.push("/contratos"));
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao excluir.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card title="Informações básicas" subtitle="Edite os dados principais do contrato.">
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-[var(--color-ink)]">Tipo de contrato</label>
            <div className="grid gap-2 sm:grid-cols-3">
              {TIPOS.map(([key, label]) => (
                <button
                  type="button"
                  key={key}
                  onClick={() => setTipo(key)}
                  className={`rounded-xl border px-3 py-2 text-sm text-left transition ${tipo === key ? "border-violet-500 bg-violet-50 text-violet-800 font-semibold" : "border-[var(--color-border)] text-[var(--color-ink)] hover:bg-[var(--color-surface-alt)]"}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-[var(--color-ink)]">Título</label>
            <input
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2.5 text-sm outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/20"
              placeholder="Ex: Arrendamento Rural — Fazenda São João"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-[var(--color-ink)]">Objeto</label>
            <textarea
              value={objeto}
              onChange={(e) => setObjeto(e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2.5 text-sm outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/20"
              placeholder="Descreva o objeto principal do contrato..."
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-[var(--color-ink)]">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as StatusContrato)}
              className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2.5 text-sm bg-[var(--color-surface)]"
            >
              {STATUS_EDITAVEIS.map((s) => (
                <option key={s} value={s}>{LABEL_STATUS_CONTRATO[s]}</option>
              ))}
            </select>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-[var(--color-ink)]">Valor (R$)</label>
              <input
                type="text"
                value={valorReais}
                onChange={(e) => setValorReais(e.target.value)}
                className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2.5 text-sm"
                placeholder="15.000,00"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-[var(--color-ink)]">Vigência início</label>
              <input
                type="date"
                value={vigenciaInicio}
                onChange={(e) => setVigenciaInicio(e.target.value)}
                className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-[var(--color-ink)]">Vigência fim</label>
              <input
                type="date"
                value={vigenciaFim}
                onChange={(e) => setVigenciaFim(e.target.value)}
                className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2.5 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-[var(--color-ink)]">Caso vinculado (opcional)</label>
            <input
              value={casoId}
              onChange={(e) => setCasoId(e.target.value)}
              className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2.5 text-sm"
              placeholder="CAS-2026-001"
            />
          </div>
        </div>
      </Card>

      <Card title="Partes" subtitle="Identifique todas as partes do contrato.">
        <div className="space-y-3">
          {partes.map((parte, idx) => (
            <div key={idx} className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto] rounded-xl border border-[var(--color-border)] p-3 items-end">
              <div>
                <label className="mb-1 block text-xs font-semibold text-[var(--color-muted)]">Papel</label>
                <select
                  value={parte.papel ?? "outro"}
                  onChange={(e) => atualizarParte(idx, "papel", e.target.value)}
                  className="w-full rounded-lg border border-[var(--color-border)] px-2 py-2 text-sm"
                >
                  {["contratante", "contratado", "locador", "locatario", "arrendador", "arrendatario", "cedente", "cessionario", "outro"].map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-[var(--color-muted)]">Nome</label>
                <input
                  value={parte.nome ?? ""}
                  onChange={(e) => atualizarParte(idx, "nome", e.target.value)}
                  className="w-full rounded-lg border border-[var(--color-border)] px-2 py-2 text-sm"
                  placeholder="Nome completo ou razão social"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-[var(--color-muted)]">CPF/CNPJ</label>
                <input
                  value={parte.cpfCnpj ?? ""}
                  onChange={(e) => atualizarParte(idx, "cpfCnpj", e.target.value)}
                  className="w-full rounded-lg border border-[var(--color-border)] px-2 py-2 text-sm"
                  placeholder="000.000.000-00"
                />
              </div>
              <button
                type="button"
                onClick={() => removerParte(idx)}
                className="rounded px-2 py-2 text-xs text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors h-fit"
                title="Remover parte"
              >
                ✕
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={adicionarParte}
            className="rounded-xl border border-dashed border-[var(--color-border)] px-4 py-2 text-sm text-[var(--color-muted)] hover:bg-[var(--color-surface-alt)]"
          >
            + Adicionar parte
          </button>
        </div>
      </Card>

      {erro && <p className="text-sm text-rose-700">⚠️ {erro}</p>}

      <div className="flex items-center gap-3 flex-wrap">
        <button
          type="submit"
          disabled={salvando || isPending}
          className="rounded-xl bg-[var(--color-accent)] px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-60 hover:bg-[var(--color-accent-strong)]"
        >
          {salvando ? "Salvando..." : "Salvar alterações"}
        </button>
        <button
          type="button"
          onClick={() => router.push(`/contratos/${contrato.id}`)}
          className="rounded-xl border border-[var(--color-border)] px-4 py-2.5 text-sm font-medium text-[var(--color-ink)] hover:bg-[var(--color-surface-alt)]"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={handleExcluir}
          className="rounded-xl border border-rose-300 px-4 py-2.5 text-sm font-medium text-rose-600 hover:bg-rose-50 ml-auto"
        >
          Excluir contrato
        </button>
      </div>
    </form>
  );
}