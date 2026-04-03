"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { TipoContrato, ParteContrato } from "@/modules/contratos/domain/types";
import { LABEL_TIPO_CONTRATO } from "@/modules/contratos/domain/types";
import { Card } from "@/components/ui/card";

const TIPOS = Object.entries(LABEL_TIPO_CONTRATO) as [TipoContrato, string][];

export function FormNovoContrato() {
  const router = useRouter();
  const [tipo, setTipo] = useState<TipoContrato>("prestacao_servicos");
  const [titulo, setTitulo] = useState("");
  const [objeto, setObjeto] = useState("");
  const [casoId, setCasoId] = useState("");
  const [valorReais, setValorReais] = useState("");
  const [vigenciaInicio, setVigenciaInicio] = useState("");
  const [vigenciaFim, setVigenciaFim] = useState("");
  const [partes, setPartes] = useState<Partial<ParteContrato>[]>([{ papel: "contratante", nome: "" }, { papel: "contratado", nome: "" }]);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");

  function atualizarParte(idx: number, campo: keyof ParteContrato, valor: string) {
    setPartes((prev) => prev.map((p, i) => i === idx ? { ...p, [campo]: valor } : p));
  }

  function adicionarParte() {
    setPartes((prev) => [...prev, { papel: "outro", nome: "" }]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setLoading(true);
    try {
      const res = await fetch("/api/contratos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titulo,
          tipo,
          objeto,
          partes: partes.filter((p) => p.nome),
          casoId: casoId || undefined,
          valorReais: valorReais ? Math.round(parseFloat(valorReais.replace(",", ".")) * 100) : undefined,
          vigenciaInicio: vigenciaInicio || undefined,
          vigenciaFim: vigenciaFim || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json() as { error?: string };
        throw new Error(data.error ?? "Erro ao criar contrato.");
      }
      const data = await res.json() as { contrato: { id: string } };
      router.push(`/contratos/${data.contrato.id}`);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro inesperado.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card title="Informações básicas" subtitle="Dados principais do contrato.">
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-[var(--color-ink)]">Tipo de contrato <span className="text-rose-600">*</span></label>
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
            <label className="mb-1.5 block text-sm font-semibold text-[var(--color-ink)]">Título <span className="text-rose-600">*</span></label>
            <input value={titulo} onChange={(e) => setTitulo(e.target.value)} required
              className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2.5 text-sm outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/20"
              placeholder="Ex: Arrendamento Rural — Fazenda São João" />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-[var(--color-ink)]">Objeto <span className="text-rose-600">*</span></label>
            <textarea value={objeto} onChange={(e) => setObjeto(e.target.value)} required rows={3}
              className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2.5 text-sm outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/20"
              placeholder="Descreva o objeto principal do contrato..." />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-[var(--color-ink)]">Valor (R$)</label>
              <input type="text" value={valorReais} onChange={(e) => setValorReais(e.target.value)}
                className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2.5 text-sm"
                placeholder="15.000,00" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-[var(--color-ink)]">Vigência início</label>
              <input type="date" value={vigenciaInicio} onChange={(e) => setVigenciaInicio(e.target.value)}
                className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2.5 text-sm" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-[var(--color-ink)]">Vigência fim</label>
              <input type="date" value={vigenciaFim} onChange={(e) => setVigenciaFim(e.target.value)}
                className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2.5 text-sm" />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-[var(--color-ink)]">Caso vinculado (opcional)</label>
            <input value={casoId} onChange={(e) => setCasoId(e.target.value)}
              className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2.5 text-sm"
              placeholder="CAS-2026-001" />
          </div>
        </div>
      </Card>

      <Card title="Partes" subtitle="Identifique todas as partes do contrato.">
        <div className="space-y-3">
          {partes.map((parte, idx) => (
            <div key={idx} className="grid gap-3 md:grid-cols-3 rounded-xl border border-[var(--color-border)] p-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-[var(--color-muted)]">Papel</label>
                <select value={parte.papel ?? "outro"} onChange={(e) => atualizarParte(idx, "papel", e.target.value)}
                  className="w-full rounded-lg border border-[var(--color-border)] px-2 py-2 text-sm">
                  {["contratante","contratado","locador","locatario","arrendador","arrendatario","cedente","cessionario","outro"].map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-[var(--color-muted)]">Nome</label>
                <input value={parte.nome ?? ""} onChange={(e) => atualizarParte(idx, "nome", e.target.value)}
                  className="w-full rounded-lg border border-[var(--color-border)] px-2 py-2 text-sm" placeholder="Nome completo ou razão social" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-[var(--color-muted)]">CPF/CNPJ</label>
                <input value={parte.cpfCnpj ?? ""} onChange={(e) => atualizarParte(idx, "cpfCnpj", e.target.value)}
                  className="w-full rounded-lg border border-[var(--color-border)] px-2 py-2 text-sm" placeholder="000.000.000-00" />
              </div>
            </div>
          ))}
          <button type="button" onClick={adicionarParte}
            className="rounded-xl border border-dashed border-[var(--color-border)] px-4 py-2 text-sm text-[var(--color-muted)] hover:bg-[var(--color-surface-alt)]">
            + Adicionar parte
          </button>
        </div>
      </Card>

      {erro && <p className="text-sm text-rose-700">⚠️ {erro}</p>}

      <div className="flex gap-3">
        <button type="submit" disabled={loading}
          className="rounded-xl bg-[var(--color-accent)] px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-60 hover:bg-[var(--color-accent-strong)]">
          {loading ? "Criando..." : "📄 Criar contrato com cláusulas padrão"}
        </button>
      </div>
    </form>
  );
}
