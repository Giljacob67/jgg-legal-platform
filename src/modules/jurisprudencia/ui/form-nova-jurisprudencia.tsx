"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import type { Jurisprudencia, TipoDecisao } from "@/modules/jurisprudencia/domain/types";
import { LABEL_TIPO_DECISAO } from "@/modules/jurisprudencia/domain/types";

const TIPOS_DECISAO = Object.entries(LABEL_TIPO_DECISAO) as Array<[TipoDecisao, string]>;

export function FormNovaJurisprudencia() {
  const router = useRouter();
  const [titulo, setTitulo] = useState("");
  const [ementa, setEmenta] = useState("");
  const [tribunal, setTribunal] = useState("STJ");
  const [tipo, setTipo] = useState<TipoDecisao>("acordao");
  const [relator, setRelator] = useState("");
  const [dataJulgamento, setDataJulgamento] = useState("");
  const [materiasTexto, setMateriasTexto] = useState("");
  const [tese, setTese] = useState("");
  const [fundamentosTexto, setFundamentosTexto] = useState("");
  const [urlOrigem, setUrlOrigem] = useState("");
  const [ementaResumida, setEmentaResumida] = useState("");
  const [relevancia, setRelevancia] = useState(4);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");

  function parseLista(input: string): string[] {
    return input
      .split(/[,\n;]/)
      .map((valor) => valor.trim())
      .filter(Boolean);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErro("");
    setLoading(true);

    const payload: Omit<Jurisprudencia, "id" | "criadoEm"> = {
      titulo,
      ementa,
      tribunal,
      tipo,
      materias: parseLista(materiasTexto),
      fundamentosLegais: parseLista(fundamentosTexto),
      relevancia,
      relator: relator || undefined,
      dataJulgamento: dataJulgamento || undefined,
      tese: tese || undefined,
      urlOrigem: urlOrigem || undefined,
      ementaResumida: ementaResumida || undefined,
    };

    try {
      const response = await fetch("/api/jurisprudencia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? "Erro ao criar jurisprudência.");
      }

      const data = (await response.json()) as { jurisprudencia: { id: string } };
      router.push(`/jurisprudencia/${data.jurisprudencia.id}`);
    } catch (submitError) {
      setErro(submitError instanceof Error ? submitError.message : "Erro inesperado ao salvar jurisprudência.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card title="Dados principais" subtitle="Cadastre a decisão para enriquecer a base de precedentes.">
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-[var(--color-ink)]">
              Título <span className="text-rose-600">*</span>
            </label>
            <input
              value={titulo}
              onChange={(event) => setTitulo(event.target.value)}
              required
              placeholder="Ex: REsp 1.999.000/MT — Arrendamento rural e prazo mínimo legal"
              className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2.5 text-sm outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/20"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-[var(--color-ink)]">
                Tribunal <span className="text-rose-600">*</span>
              </label>
              <input
                value={tribunal}
                onChange={(event) => setTribunal(event.target.value.toUpperCase())}
                required
                placeholder="STJ"
                className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2.5 text-sm uppercase"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-[var(--color-ink)]">
                Tipo de decisão <span className="text-rose-600">*</span>
              </label>
              <select
                value={tipo}
                onChange={(event) => setTipo(event.target.value as TipoDecisao)}
                className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2.5 text-sm"
              >
                {TIPOS_DECISAO.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-[var(--color-ink)]">Relevância (1-5)</label>
              <input
                type="number"
                min={1}
                max={5}
                value={relevancia}
                onChange={(event) => setRelevancia(Math.max(1, Math.min(5, Number(event.target.value) || 1)))}
                className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2.5 text-sm"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-[var(--color-ink)]">Relator</label>
              <input
                value={relator}
                onChange={(event) => setRelator(event.target.value)}
                placeholder="Min. Nome do Relator"
                className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-[var(--color-ink)]">Data de julgamento</label>
              <input
                type="date"
                value={dataJulgamento}
                onChange={(event) => setDataJulgamento(event.target.value)}
                className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2.5 text-sm"
              />
            </div>
          </div>
        </div>
      </Card>

      <Card title="Conteúdo jurídico" subtitle="Informe a ementa e os metadados de indexação da decisão.">
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-[var(--color-ink)]">
              Ementa completa <span className="text-rose-600">*</span>
            </label>
            <textarea
              value={ementa}
              onChange={(event) => setEmenta(event.target.value)}
              required
              rows={6}
              placeholder="Texto integral da ementa..."
              className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2.5 text-sm"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-[var(--color-ink)]">Resumo da ementa (opcional)</label>
            <textarea
              value={ementaResumida}
              onChange={(event) => setEmentaResumida(event.target.value)}
              rows={3}
              placeholder="Resumo curto para exibição na listagem e nas sugestões."
              className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2.5 text-sm"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-[var(--color-ink)]">Tese jurídica principal (opcional)</label>
            <textarea
              value={tese}
              onChange={(event) => setTese(event.target.value)}
              rows={3}
              placeholder="Síntese da tese que pode orientar petições futuras."
              className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2.5 text-sm"
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-[var(--color-ink)]">
                Matérias <span className="text-rose-600">*</span>
              </label>
              <textarea
                value={materiasTexto}
                onChange={(event) => setMateriasTexto(event.target.value)}
                required
                rows={3}
                placeholder="Ex: direito agrário, arrendamento rural, crédito rural"
                className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-[var(--color-ink)]">Fundamentos legais</label>
              <textarea
                value={fundamentosTexto}
                onChange={(event) => setFundamentosTexto(event.target.value)}
                rows={3}
                placeholder="Ex: Art. 5º, XXVI, CF/88; Art. 833, VIII, CPC"
                className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2.5 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-[var(--color-ink)]">URL de origem</label>
            <input
              type="url"
              value={urlOrigem}
              onChange={(event) => setUrlOrigem(event.target.value)}
              placeholder="https://..."
              className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2.5 text-sm"
            />
          </div>
        </div>
      </Card>

      {erro ? <p className="text-sm text-rose-700">⚠️ {erro}</p> : null}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-[var(--color-accent)] px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-60 hover:bg-[var(--color-accent-strong)]"
        >
          {loading ? "Salvando..." : "Salvar jurisprudência"}
        </button>
      </div>
    </form>
  );
}
