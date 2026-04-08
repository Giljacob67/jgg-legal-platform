"use client";

import { useMemo, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Highlight from "@tiptap/extension-highlight";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import type { ContextoJuridicoPedido, Minuta } from "@/modules/peticoes/domain/types";
import type { RastroGeracaoMinuta } from "@/modules/peticoes/domain/geracao-minuta";
import type { PainelInteligenciaJuridica } from "@/modules/peticoes/inteligencia-juridica/domain/types";
import { PainelInteligenciaJuridicaView } from "@/modules/peticoes/inteligencia-juridica/ui/painel-inteligencia-juridica";
import { EditorToolbar } from "@/modules/peticoes/ui/editor-toolbar";
import { VersionDiff } from "@/modules/peticoes/ui/version-diff";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatarDataHora } from "@/lib/utils";

type EditorMinutaProps = {
  minuta: Minuta;
  contextoJuridico: ContextoJuridicoPedido | null;
  versaoContextoAtual?: number;
  rastroGeracaoAtual?: RastroGeracaoMinuta;
  inteligenciaJuridica?: PainelInteligenciaJuridica | null;
  pedidoId?: string;
};

function toArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

export function EditorMinuta({
  minuta,
  contextoJuridico,
  versaoContextoAtual,
  rastroGeracaoAtual,
  inteligenciaJuridica = null,
  pedidoId,
}: EditorMinutaProps) {
  const [versaoComparadaId, setVersaoComparadaId] = useState(minuta.versoes[minuta.versoes.length - 1]?.id ?? "");
  const [mensagemSalvar, setMensagemSalvar] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [selecaoTexto, setSelecaoTexto] = useState("");
  const [instrucaoIA, setInstrucaoIA] = useState("");
  const [sugestaoIA, setSugestaoIA] = useState("");
  const [loadingIA, setLoadingIA] = useState(false);
  const [painelIAAberto, setPainelIAAberto] = useState(false);

  const fatosRelevantes = toArray<string>(contextoJuridico?.fatosRelevantes);
  const cronologia = toArray<{ data: string; descricao: string; documentoId?: string }>(contextoJuridico?.cronologia);
  const pontosControvertidos = toArray<string>(contextoJuridico?.pontosControvertidos);
  const referenciasDocumentais = toArray<{ documentoId: string; titulo: string }>(contextoJuridico?.referenciasDocumentais);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Highlight,
      Underline,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Placeholder.configure({
        placeholder: "Comece a redigir a minuta aqui...",
      }),
    ],
    content: minuta.conteudoAtual
      .split("\n")
      .map((p) => `<p>${p}</p>`)
      .join(""),
    editorProps: {
      attributes: {
        class:
          "prose prose-sm max-w-none min-h-[420px] w-full p-4 text-[var(--color-ink)] outline-none focus:outline-none",
      },
    },
    onSelectionUpdate: ({ editor }) => {
      const { from, to } = editor.state.selection;
      if (from !== to) {
        const texto = editor.state.doc.textBetween(from, to, " ");
        if (texto.trim().length > 10) {
          setSelecaoTexto(texto.trim());
        }
      }
    },
  });

  const versaoComparada = useMemo(
    () => minuta.versoes.find((versao) => versao.id === versaoComparadaId),
    [minuta.versoes, versaoComparadaId],
  );

  const conteudoAtualTexto = editor?.getText() ?? minuta.conteudoAtual;

  async function salvarRascunho() {
    if (salvando) return;
    const conteudo = editor?.getHTML() ?? minuta.conteudoAtual;
    setSalvando(true);
    setMensagemSalvar("Salvando...");
    try {
      const res = await fetch(`/api/peticoes/minutas/${minuta.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conteudo }),
      });
      if (!res.ok) {
        const json = (await res.json()) as { error?: string };
        setMensagemSalvar(`Erro ao salvar: ${json.error ?? "tente novamente."}`);
      } else {
        setMensagemSalvar(`Rascunho salvo às ${new Date().toLocaleTimeString("pt-BR")}.`);
      }
    } catch {
      setMensagemSalvar("Erro de conexão ao salvar.");
    } finally {
      setSalvando(false);
    }
  }

  async function solicitarSugestaoIA() {
    if (!selecaoTexto || !instrucaoIA || !pedidoId) return;
    setLoadingIA(true);
    setSugestaoIA("");

    try {
      const res = await fetch(`/api/agents/sugestao-ia/${pedidoId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selecao: selecaoTexto, instrucao: instrucaoIA }),
      });

      if (!res.body) {
        const json = await res.json();
        setSugestaoIA(json.sugestao ?? "Sem resposta.");
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let texto = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        texto += decoder.decode(value, { stream: true });
        setSugestaoIA(texto);
      }
    } catch {
      setSugestaoIA("Erro ao conectar com a IA.");
    } finally {
      setLoadingIA(false);
    }
  }

  function aplicarSugestaoNoEditor() {
    if (!editor || !sugestaoIA) return;
    const { from, to } = editor.state.selection;
    editor.chain().focus().deleteRange({ from, to }).insertContent(sugestaoIA).run();
    setPainelIAAberto(false);
    setSugestaoIA("");
    setInstrucaoIA("");
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.6fr,1fr]">
      <Card title={minuta.titulo} subtitle="Editor de minuta com formatação rica, geração estruturada por contexto, template e matéria.">
        <EditorToolbar editor={editor} />
        <div className="rounded-b-xl border border-t-0 border-[var(--color-border)] bg-[var(--color-card)]">
          <EditorContent editor={editor} />
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button
            onClick={salvarRascunho}
            disabled={salvando}
            className="rounded-xl bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60 hover:bg-[var(--color-accent-strong)]"
          >
            {salvando ? "Salvando..." : "Salvar rascunho"}
          </button>

          {selecaoTexto && pedidoId && (
            <button
              onClick={() => setPainelIAAberto(true)}
              className="flex items-center gap-2 rounded-xl border border-violet-300 bg-violet-50 px-4 py-2 text-sm font-semibold text-violet-700 transition hover:bg-violet-100"
            >
              ✨ Sugestão IA
            </button>
          )}

          {mensagemSalvar ? <p className="text-xs text-[var(--color-muted)]">{mensagemSalvar}</p> : null}
        </div>

        {/* Painel de Sugestão IA */}
        {painelIAAberto && (
          <div className="mt-4 rounded-xl border border-violet-200 bg-violet-50 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-violet-800">✨ Assistente IA — Sugestão de Reescrita</p>
              <button
                onClick={() => setPainelIAAberto(false)}
                className="text-xs text-violet-500 hover:text-violet-800"
              >
                Fechar
              </button>
            </div>

            <div className="rounded-lg bg-[var(--color-card)] border border-violet-100 p-3">
              <p className="text-xs font-medium text-violet-600 mb-1">Trecho selecionado:</p>
              <p className="text-sm text-[var(--color-ink)] italic line-clamp-3">&ldquo;{selecaoTexto}&rdquo;</p>
            </div>

            <div>
              <label className="text-xs font-medium text-violet-700">O que você quer melhorar?</label>
              <textarea
                className="mt-1 w-full rounded-lg border border-violet-200 bg-[var(--color-card)] p-3 text-sm text-[var(--color-ink)] outline-none focus:ring-2 focus:ring-violet-300"
                rows={2}
                placeholder='Ex: "Reformule de forma mais técnica e objetiva" ou "Adicione a referência ao art. 5º da CF"'
                value={instrucaoIA}
                onChange={(e) => setInstrucaoIA(e.target.value)}
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={solicitarSugestaoIA}
                disabled={loadingIA || !instrucaoIA}
                className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 hover:bg-violet-700"
              >
                {loadingIA ? "Consultando IA..." : "Reescrever"}
              </button>
              {sugestaoIA && (
                <button
                  onClick={aplicarSugestaoNoEditor}
                  className="rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
                >
                  ✅ Aplicar no editor
                </button>
              )}
            </div>

            {sugestaoIA && (
              <div className="rounded-lg bg-[var(--color-card)] border border-green-200 p-3">
                <p className="text-xs font-medium text-green-700 mb-1">Sugestão da IA:</p>
                <p className="text-sm text-[var(--color-ink)] whitespace-pre-wrap">{sugestaoIA}</p>
              </div>
            )}
          </div>
        )}
      </Card>

      <div className="space-y-6">
        <Card title="Contexto jurídico estruturado" subtitle="Base consolidada por snapshots versionados do pipeline.">
          {!contextoJuridico ? (
            <p className="text-sm text-[var(--color-muted)]">Contexto não disponível para esta minuta.</p>
          ) : (
            <div className="space-y-3 text-sm text-[var(--color-ink)]">
              <p className="text-xs text-[var(--color-muted)]">
                Contexto v{versaoContextoAtual ?? contextoJuridico.versaoContexto} •{" "}
                {formatarDataHora(contextoJuridico.criadoEm)}
              </p>
              <p>
                <strong>Estratégia sugerida:</strong> {contextoJuridico.estrategiaSugerida}
              </p>
              <p>
                <strong>Fatos relevantes:</strong> {fatosRelevantes.length}
              </p>
              <p>
                <strong>Cronologia:</strong> {cronologia.length} eventos
              </p>
              <p>
                <strong>Pontos controvertidos:</strong> {pontosControvertidos.length}
              </p>
              <p>
                <strong>Referências documentais:</strong> {referenciasDocumentais.length}
              </p>
              {referenciasDocumentais.length > 0 ? (
                <div className="rounded-xl border border-[var(--color-border)] p-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">
                    Referências principais
                  </p>
                  <ul className="mt-2 space-y-1 text-xs text-[var(--color-muted)]">
                    {referenciasDocumentais.slice(0, 5).map((referencia) => (
                      <li key={`${referencia.documentoId}-${referencia.titulo}`}>
                        {referencia.documentoId} • {referencia.titulo}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          )}
        </Card>

        <Card title="Rastro da geração" subtitle="Rastreabilidade de template, contexto e referências utilizadas.">
          {!rastroGeracaoAtual ? (
            <p className="text-sm text-[var(--color-muted)]">Geração estruturada indisponível para esta minuta.</p>
          ) : (
            <div className="space-y-2 text-sm text-[var(--color-ink)]">
              <p>
                <strong>Template:</strong> {rastroGeracaoAtual.templateNome} (v{rastroGeracaoAtual.templateVersao})
              </p>
              <p>
                <strong>Tipo de peça canônico:</strong> {rastroGeracaoAtual.tipoPecaCanonica}
              </p>
              <p>
                <strong>Matéria canônica:</strong> {rastroGeracaoAtual.materiaCanonica}
              </p>
              <p>
                <strong>Versão do contexto:</strong> v{rastroGeracaoAtual.contextoVersao ?? "n/d"}
              </p>
              <p>
                <strong>Referências documentais:</strong> {rastroGeracaoAtual.referenciasDocumentais.length}
              </p>
            </div>
          )}
        </Card>

        <PainelInteligenciaJuridicaView inteligenciaJuridica={inteligenciaJuridica} />

        <Card title="Comparação entre versões" subtitle="Diff visual com destaque de adições e remoções.">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-[var(--color-ink)]">Versão de referência</span>
            <select
              className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2"
              value={versaoComparadaId}
              onChange={(event) => setVersaoComparadaId(event.target.value)}
            >
              {minuta.versoes.map((versao) => (
                <option key={versao.id} value={versao.id}>
                  Versão {versao.numero} - {formatarDataHora(versao.criadoEm)}
                </option>
              ))}
            </select>
          </label>

          {versaoComparada ? (
            <div className="mt-3">
              <VersionDiff
                oldText={versaoComparada.conteudo}
                newText={conteudoAtualTexto}
                oldLabel={`Versão ${versaoComparada.numero}`}
                newLabel="Texto atual"
              />
            </div>
          ) : (
            <p className="mt-2 text-sm text-[var(--color-muted)]">
              Selecione uma versão para comparar.
            </p>
          )}
        </Card>

        <Card title="Histórico de versões" subtitle="Rastreabilidade de alterações do documento.">
          <div className="space-y-3">
            {minuta.versoes
              .slice()
              .reverse()
              .map((versao) => (
                <article key={versao.id} className="rounded-xl border border-[var(--color-border)] p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-[var(--color-ink)]">Versão {versao.numero}</p>
                    <StatusBadge label="registrada" variant="sucesso" />
                  </div>
                  <p className="mt-1 text-xs text-[var(--color-muted)]">
                    {versao.autor} • {formatarDataHora(versao.criadoEm)}
                  </p>
                  <p className="mt-1 text-xs text-[var(--color-muted)]">
                    Contexto de origem: v{versao.contextoVersaoOrigem ?? versaoContextoAtual ?? "n/d"}
                  </p>
                  <p className="text-xs text-[var(--color-muted)]">
                    Template: {versao.templateNomeOrigem ?? "n/d"}{" "}
                    {versao.templateVersaoOrigem ? `(v${versao.templateVersaoOrigem})` : ""}
                  </p>
                  <p className="text-xs text-[var(--color-muted)]">
                    Referências: {versao.referenciasDocumentaisOrigem?.length ?? 0}
                  </p>
                  <p className="mt-2 text-sm text-[var(--color-muted)]">{versao.resumoMudancas}</p>
                </article>
              ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
