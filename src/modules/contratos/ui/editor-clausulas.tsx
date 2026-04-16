"use client";

import { useState, useTransition } from "react";
import type { Clausula, Contrato, TipoClausula } from "@/modules/contratos/domain/types";
import { useRouter } from "next/navigation";

const TIPO_CLAUSULA_LABEL: Record<TipoClausula, string> = {
  essencial: "Essencial",
  negociavel: "Negociável",
  opcional: "Opcional",
  proibida: "Proibida",
};

const TIPO_CLAUSULA_COR: Record<TipoClausula, string> = {
  essencial: "bg-blue-50 text-blue-700 border-blue-200",
  negociavel: "bg-amber-50 text-amber-700 border-amber-200",
  opcional: "bg-gray-100 text-gray-500 border-gray-200",
  proibida: "bg-rose-50 text-rose-700 border-rose-200",
};

interface Props {
  contratoId: string;
  clausulasIniciais: Clausula[];
  conteudoInicial: string;
}

interface ClausulaEditada extends Clausula {
  _editando?: boolean;
}

export function EditorClausulas({ contratoId, clausulasIniciais, conteudoInicial }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [clausulas, setClausulas] = useState<ClausulaEditada[]>(clausulasIniciais);
  const [conteudoAtual, setConteudoAtual] = useState(conteudoInicial);
  const [gerandoIA, setGerandoIA] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [avisoParcial, setAvisoParcial] = useState<string | null>(null);

  // ── Edição inline de cláusula ─────────────────────────────

  function toggleEditar(id: string) {
    setClausulas((prev) =>
      prev.map((c) => (c.id === id ? { ...c, _editando: !c._editando } : c))
    );
  }

  function atualizarClausula(id: string, campo: keyof Clausula, valor: string | number) {
    setClausulas((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [campo]: valor } : c))
    );
  }

  function removerClausula(id: string) {
    setClausulas((prev) => {
      const nova = prev.filter((c) => c.id !== id);
      return nova.map((c, i) => ({ ...c, numero: i + 1 }));
    });
  }

  function adicionarClausula() {
    const novoNumero = clausulas.length + 1;
    const nova: ClausulaEditada = {
      id: `cl-novo-${Date.now()}`,
      numero: novoNumero,
      titulo: `Cláusula ${novoNumero}ª`,
      conteudo: "",
      tipo: "negociavel",
      _editando: true,
    };
    setClausulas((prev) => [...prev, nova]);
  }

  // ── Salvar manualmente ───────────────────────────────────

  async function salvar() {
    setSalvando(true);
    setErro(null);
    try {
      const clausulasLimpas: Clausula[] = clausulas.map(({ _editando: _, ...c }) => c);
      const res = await fetch(`/api/contratos/${contratoId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clausulas: clausulasLimpas, conteudoAtual }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Erro ao salvar.");
      }
      startTransition(() => router.refresh());
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao salvar.");
    } finally {
      setSalvando(false);
    }
  }

  // ── Gerar minuta com IA ──────────────────────────────────

  async function gerarComIA() {
    setGerandoIA(true);
    setErro(null);
    setAvisoParcial(null);
    try {
      const res = await fetch(`/api/contratos/${contratoId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ acao: "gerar-minuta" }),
      });
      const data = await res.json() as { contrato?: Contrato; aviso?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Erro ao gerar minuta.");
      if (data.contrato) {
        setClausulas(data.contrato.clausulas);
        setConteudoAtual(data.contrato.conteudoAtual);
      }
      if (data.aviso) setAvisoParcial(data.aviso);
      startTransition(() => router.refresh());
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao gerar minuta.");
    } finally {
      setGerandoIA(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Barra de ações */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-sm text-[var(--color-muted)]">
          {clausulas.length} cláusula{clausulas.length !== 1 ? "s" : ""}
        </p>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={gerarComIA}
            disabled={gerandoIA || salvando}
            className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-sm font-medium text-[var(--color-ink)] hover:bg-[var(--color-surface-alt)] disabled:opacity-50 transition-colors flex items-center gap-1.5"
          >
            {gerandoIA ? (
              <>
                <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-[var(--color-accent)] border-t-transparent" />
                Gerando...
              </>
            ) : (
              "Gerar com IA"
            )}
          </button>
          <button
            onClick={adicionarClausula}
            disabled={salvando}
            className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-sm font-medium text-[var(--color-ink)] hover:bg-[var(--color-surface-alt)] disabled:opacity-50 transition-colors"
          >
            + Nova cláusula
          </button>
          <button
            onClick={salvar}
            disabled={salvando || gerandoIA}
            className="rounded-lg bg-[var(--color-accent)] px-4 py-1.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center gap-1.5"
          >
            {salvando ? (
              <>
                <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Salvando...
              </>
            ) : (
              "Salvar alterações"
            )}
          </button>
        </div>
      </div>

      {/* Avisos */}
      {erro && (
        <div className="rounded-lg bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-700">
          {erro}
        </div>
      )}
      {avisoParcial && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-700">
          {avisoParcial}
        </div>
      )}
      {isPending && (
        <div className="text-xs text-[var(--color-muted)]">Atualizando página...</div>
      )}

      {/* Lista de cláusulas */}
      <div className="space-y-3">
        {clausulas.map((c) => (
          <div
            key={c.id}
            className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden"
          >
            {/* Cabeçalho da cláusula */}
            <div className="flex items-center justify-between px-4 py-3 gap-2">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {c._editando ? (
                  <input
                    value={c.titulo}
                    onChange={(e) => atualizarClausula(c.id, "titulo", e.target.value)}
                    className="flex-1 rounded border border-[var(--color-border)] px-2 py-1 text-sm font-semibold text-[var(--color-ink)] bg-transparent focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] min-w-0"
                  />
                ) : (
                  <p className="font-semibold text-sm text-[var(--color-ink)] truncate">
                    {c.numero}. {c.titulo}
                  </p>
                )}
                {c._editando ? (
                  <select
                    value={c.tipo}
                    onChange={(e) => atualizarClausula(c.id, "tipo", e.target.value)}
                    className="rounded border border-[var(--color-border)] px-1.5 py-1 text-xs bg-[var(--color-surface)] text-[var(--color-ink)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
                  >
                    {(Object.keys(TIPO_CLAUSULA_LABEL) as TipoClausula[]).map((t) => (
                      <option key={t} value={t}>{TIPO_CLAUSULA_LABEL[t]}</option>
                    ))}
                  </select>
                ) : (
                  <span className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-semibold ${TIPO_CLAUSULA_COR[c.tipo]}`}>
                    {TIPO_CLAUSULA_LABEL[c.tipo]}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => toggleEditar(c.id)}
                  className="rounded px-2 py-1 text-xs text-[var(--color-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-surface-alt)] transition-colors"
                >
                  {c._editando ? "Concluir" : "Editar"}
                </button>
                <button
                  onClick={() => removerClausula(c.id)}
                  className="rounded px-2 py-1 text-xs text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                  title="Remover cláusula"
                >
                  Remover
                </button>
              </div>
            </div>

            {/* Conteúdo */}
            <div className="px-4 pb-4">
              {c._editando ? (
                <textarea
                  value={c.conteudo}
                  onChange={(e) => atualizarClausula(c.id, "conteudo", e.target.value)}
                  rows={6}
                  className="w-full rounded border border-[var(--color-border)] px-3 py-2 text-xs text-[var(--color-ink)] bg-transparent focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] resize-y leading-relaxed"
                />
              ) : (
                <p className="text-xs text-[var(--color-muted)] leading-relaxed whitespace-pre-wrap">
                  {c.conteudo || <span className="italic">Sem conteúdo.</span>}
                </p>
              )}
            </div>
          </div>
        ))}

        {clausulas.length === 0 && (
          <div className="rounded-xl border border-dashed border-[var(--color-border)] p-8 text-center text-sm text-[var(--color-muted)]">
            Nenhuma cláusula. Clique em "Nova cláusula" ou use "Gerar com IA".
          </div>
        )}
      </div>

      {/* Texto corrido */}
      <div>
        <label className="block text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wide mb-2">
          Texto corrido do contrato
        </label>
        <textarea
          value={conteudoAtual}
          onChange={(e) => setConteudoAtual(e.target.value)}
          rows={16}
          className="w-full rounded-xl border border-[var(--color-border)] px-4 py-3 text-xs text-[var(--color-ink)] bg-[var(--color-surface)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] resize-y leading-relaxed font-mono"
          placeholder="O texto corrido do contrato aparecerá aqui após gerar com IA ou pode ser editado manualmente."
        />
      </div>
    </div>
  );
}
