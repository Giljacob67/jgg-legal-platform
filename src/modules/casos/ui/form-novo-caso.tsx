"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import type { NovoCasoPayload } from "@/modules/casos/infrastructure/mockCasosRepository";

const MATERIAS = [
  "Agrário / Agronegócio",
  "Bancário",
  "Cível",
  "Consumidor",
  "Criminal",
  "Empresarial",
  "Família",
  "Tributário",
  "Trabalhista",
  "Ambiental",
];

const PAPEIS_PARTE = ["autor", "réu", "terceiro"] as const;

type ParteForm = { nome: string; papel: (typeof PAPEIS_PARTE)[number] };

export function FormNovoCaso() {
  const router = useRouter();

  const [titulo, setTitulo] = useState("");
  const [cliente, setCliente] = useState("");
  const [materia, setMateria] = useState(MATERIAS[0]);
  const [tribunal, setTribunal] = useState("");
  const [prazoFinal, setPrazoFinal] = useState("");
  const [resumo, setResumo] = useState("");
  const [partes, setPartes] = useState<ParteForm[]>([{ nome: "", papel: "autor" }]);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");

  function adicionarParte() {
    setPartes((prev: ParteForm[]) => [...prev, { nome: "", papel: "réu" }]);
  }

  function removerParte(index: number) {
    setPartes((prev: ParteForm[]) => prev.filter((_: ParteForm, i: number) => i !== index));
  }

  function atualizarParte(index: number, campo: keyof ParteForm, valor: string) {
    setPartes((prev: ParteForm[]) =>
      prev.map((parte: ParteForm, i: number) =>
        i === index ? { ...parte, [campo]: valor } : parte,
      ),
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErro("");
    setLoading(true);

    const partesValidas = partes.filter((p: ParteForm) => p.nome.trim().length > 0);

    const payload: NovoCasoPayload = {
      titulo,
      cliente,
      materia,
      tribunal: tribunal || undefined,
      prazoFinal: prazoFinal || undefined,
      resumo: resumo || undefined,
      partes: partesValidas.length > 0 ? partesValidas : undefined,
    };

    try {
      const response = await fetch("/api/casos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? "Erro ao criar caso.");
      }

      const data = (await response.json()) as { caso: { id: string } };
      router.push(`/casos/${data.caso.id}`);
    } catch (submitError) {
      setErro(submitError instanceof Error ? submitError.message : "Erro inesperado ao criar caso.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card title="Informações do caso" subtitle="Dados principais para identificação e roteamento jurídico.">
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-[var(--color-ink)]">
              Título do caso <span className="text-rose-600">*</span>
            </label>
            <input
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              required
              placeholder="Ex: Execução de CPR - Fazenda São Lucas vs. Trading AgroExport"
              className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2.5 text-sm outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/20"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-[var(--color-ink)]">
                Cliente <span className="text-rose-600">*</span>
              </label>
              <input
                value={cliente}
                onChange={(e) => setCliente(e.target.value)}
                required
                placeholder="Ex: Fazenda São Lucas Ltda."
                className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2.5 text-sm outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/20"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-[var(--color-ink)]">
                Matéria <span className="text-rose-600">*</span>
              </label>
              <select
                value={materia}
                onChange={(e) => setMateria(e.target.value)}
                className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2.5 text-sm"
              >
                {MATERIAS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-[var(--color-ink)]">Tribunal</label>
              <input
                value={tribunal}
                onChange={(e) => setTribunal(e.target.value)}
                placeholder="Ex: TJMT, TRF-1, STJ"
                className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2.5 text-sm"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-[var(--color-ink)]">Prazo final</label>
              <input
                type="date"
                value={prazoFinal}
                onChange={(e) => setPrazoFinal(e.target.value)}
                className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2.5 text-sm"
              />
            </div>
          </div>
        </div>
      </Card>

      <Card title="Partes processuais" subtitle="Identifique as partes envolvidas no caso.">
        <div className="space-y-3">
          {partes.map((parte, index) => (
            <div key={index} className="flex gap-3 items-end">
              <div className="flex-1">
                <label className="mb-1 block text-xs font-semibold text-[var(--color-ink)]">Nome</label>
                <input
                  value={parte.nome}
                  onChange={(e) => atualizarParte(index, "nome", e.target.value)}
                  placeholder="Nome completo ou razão social"
                  className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm"
                />
              </div>
              <div className="w-36">
                <label className="mb-1 block text-xs font-semibold text-[var(--color-ink)]">Papel</label>
                <select
                  value={parte.papel}
                  onChange={(e) => atualizarParte(index, "papel", e.target.value)}
                  className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm"
                >
                  {PAPEIS_PARTE.map((papel) => (
                    <option key={papel} value={papel}>
                      {papel}
                    </option>
                  ))}
                </select>
              </div>
              {partes.length > 1 && (
                <button
                  type="button"
                  onClick={() => removerParte(index)}
                  className="mb-0.5 rounded-xl border border-rose-200 px-3 py-2 text-xs text-rose-600 hover:bg-rose-50"
                >
                  Remover
                </button>
              )}
            </div>
          ))}

          <button
            type="button"
            onClick={adicionarParte}
            className="text-sm font-semibold text-[var(--color-accent)] hover:underline"
          >
            + Adicionar parte
          </button>
        </div>
      </Card>

      <Card title="Resumo do caso" subtitle="Descrição objetiva para orientar o pipeline de IA.">
        <textarea
          value={resumo}
          onChange={(e) => setResumo(e.target.value)}
          rows={5}
          placeholder="Ex: Produtor rural inadimpliu CPR financeira de R$ 3,2 milhões. Alega caso fortuito por seca extrema comprovada por laudo INMET. Escritório representa o credor (polo ativo)."
          className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2.5 text-sm"
        />
      </Card>

      {erro ? <p className="text-sm text-rose-700">⚠️ {erro}</p> : null}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-[var(--color-accent)] px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-60 hover:bg-[var(--color-accent-strong)]"
        >
          {loading ? "Criando caso..." : "Criar caso"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-xl border border-[var(--color-border)] px-6 py-2.5 text-sm font-semibold text-[var(--color-ink)] hover:bg-[var(--color-hover)]"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
