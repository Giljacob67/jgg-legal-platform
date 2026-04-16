"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import type { Caso, StatusCaso } from "@/modules/casos/domain/types";
import type { AtualizarCasoPayload } from "@/modules/casos/infrastructure/mockCasosRepository";

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

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "novo", label: "Novo" },
  { value: "em análise", label: "Em análise" },
  { value: "estratégia", label: "Estratégia" },
  { value: "minuta em elaboração", label: "Minuta em elaboração" },
  { value: "revisão", label: "Revisão" },
  { value: "protocolado", label: "Protocolado" },
];

const PAPEIS_PARTE = ["autor", "réu", "terceiro"] as const;

type ParteForm = { nome: string; papel: (typeof PAPEIS_PARTE)[number] };

interface FormEditarCasoProps {
  caso: Caso;
}

export function FormEditarCaso({ caso }: FormEditarCasoProps) {
  const router = useRouter();

  const [titulo, setTitulo] = useState(caso.titulo);
  const [cliente, setCliente] = useState(caso.cliente);
  const [materia, setMateria] = useState(caso.materia);
  const [tribunal, setTribunal] = useState(caso.tribunal);
  const [prazoFinal, setPrazoFinal] = useState(caso.prazoFinal);
  const [resumo, setResumo] = useState(caso.resumo);
  const [status, setStatus] = useState<StatusCaso>(caso.status);
  const [partes, setPartes] = useState<ParteForm[]>(
    caso.partes.length > 0 ? caso.partes : [{ nome: "", papel: "autor" }],
  );
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [mostrarConfirmacao, setMostrarConfirmacao] = useState(false);

  function adicionarParte() {
    setPartes((prev) => [...prev, { nome: "", papel: "réu" }]);
  }

  function removerParte(index: number) {
    setPartes((prev) => prev.filter((_, i) => i !== index));
  }

  function atualizarParte(index: number, campo: keyof ParteForm, valor: string) {
    setPartes((prev) =>
      prev.map((parte, i) => (i === index ? { ...parte, [campo]: valor } : parte)),
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErro("");
    setLoading(true);

    const partesValidas = partes.filter((p) => p.nome.trim().length > 0);

    const payload: AtualizarCasoPayload = {
      titulo,
      cliente,
      materia,
      tribunal: tribunal || undefined,
      prazoFinal: prazoFinal || undefined,
      resumo: resumo || undefined,
      status,
      partes: partesValidas.length > 0 ? partesValidas : undefined,
    };

    try {
      const response = await fetch(`/api/casos/${caso.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? "Erro ao atualizar caso.");
      }

      router.push(`/casos/${caso.id}`);
      router.refresh();
    } catch (submitError) {
      setErro(submitError instanceof Error ? submitError.message : "Erro inesperado ao atualizar caso.");
    } finally {
      setLoading(false);
    }
  }

  async function handleExcluir() {
    setLoading(true);
    setErro("");

    try {
      const response = await fetch(`/api/casos/${caso.id}`, { method: "DELETE" });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? "Erro ao excluir caso.");
      }

      router.push("/casos");
      router.refresh();
    } catch (deleteError) {
      setErro(deleteError instanceof Error ? deleteError.message : "Erro inesperado ao excluir caso.");
      setMostrarConfirmacao(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card title="Informações do caso" subtitle="Edite os dados principais do caso.">
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

          <div className="grid gap-4 md:grid-cols-3">
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

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-[var(--color-ink)]">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as StatusCaso)}
                className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2.5 text-sm"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
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

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-[var(--color-accent)] px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-60 hover:bg-[var(--color-accent-strong)]"
        >
          {loading ? "Salvando..." : "Salvar alterações"}
        </button>
        <button
          type="button"
          onClick={() => router.push(`/casos/${caso.id}`)}
          className="rounded-xl border border-[var(--color-border)] px-6 py-2.5 text-sm font-semibold text-[var(--color-ink)] hover:bg-[var(--color-hover)]"
        >
          Cancelar
        </button>

        <div className="ml-auto">
          <button
            type="button"
            onClick={() => setMostrarConfirmacao(true)}
            disabled={loading}
            className="rounded-xl border border-rose-300 px-6 py-2.5 text-sm font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-60"
          >
            Excluir caso
          </button>
        </div>
      </div>

      {mostrarConfirmacao && (
        <div className="rounded-xl border border-rose-300 bg-rose-50 p-4">
          <p className="text-sm font-semibold text-rose-700">
            Tem certeza que deseja excluir o caso &quot;{caso.titulo}&quot;? Esta ação não pode ser desfeita.
          </p>
          <div className="mt-3 flex gap-3">
            <button
              type="button"
              onClick={handleExcluir}
              disabled={loading}
              className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
            >
              {loading ? "Excluindo..." : "Confirmar exclusão"}
            </button>
            <button
              type="button"
              onClick={() => setMostrarConfirmacao(false)}
              className="rounded-xl border border-[var(--color-border)] px-4 py-2 text-sm font-semibold text-[var(--color-ink)] hover:bg-[var(--color-hover)]"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </form>
  );
}