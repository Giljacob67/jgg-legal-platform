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
import { InlineAlert } from "@/components/ui/inline-alert";
import { SelectInput } from "@/components/ui/select-input";
import { StatusBadge } from "@/components/ui/status-badge";
import { TextareaInput } from "@/components/ui/textarea-input";
import { SparkIcon } from "@/components/ui/icons";
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
  const [versaoComparadaId, setVersaoComparadaId] = useState(
    minuta.versoes[minuta.versoes.length - 1]?.id ?? "",
  );
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
  const referenciasDocumentais = toArray<{ documentoId: string; titulo: string }>(
    contextoJuridico?.referenciasDocumentais,
  );
  const tesesConfirmadas = toArray(contextoJuridico?.teses).filter(
    (tese): tese is NonNullable<ContextoJuridicoPedido["teses"]>[number] =>
      typeof tese === "object" &&
      tese !== null &&
      "statusValidacao" in tese &&
      (tese.statusValidacao === "aprovada" || tese.statusValidacao === "ajustada"),
  );

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
          "prose prose-sm max-w-none min-h-[460px] w-full p-5 text-[var(--color-ink)] outline-none focus:outline-none",
      },
    },
    onSelectionUpdate: ({ editor }) => {
      const { from, to } = editor.state.selection;
      if (from === to) return;
      const texto = editor.state.doc.textBetween(from, to, " ");
      if (texto.trim().length > 10) {
        setSelecaoTexto(texto.trim());
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
        return;
      }

      setMensagemSalvar(`Rascunho salvo às ${new Date().toLocaleTimeString("pt-BR")}.`);
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
        const json = (await res.json()) as { sugestao?: string };
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

  const proximosPassos = [
    contextoJuridico ? "Conferir coerência entre estratégia consolidada e pedidos finais da minuta." : "Consolidar contexto jurídico antes da revisão final da peça.",
    contextoJuridico?.validacaoHumanaTesesPendente
      ? "Validar teses inferidas ou registrar tese manual antes da submissão para aprovação."
      : "Checar aderência da redação às teses já confirmadas pelo responsável jurídico.",
    referenciasDocumentais.length > 0
      ? "Validar se todas as referências documentais citadas estão corretas e atualizadas."
      : "Anexar ou vincular documentos-chave para fortalecer fundamentação e provas.",
    "Executar comparação com versão anterior antes de submeter para aprovação.",
  ];

  return (
    <div className="grid gap-6 xl:grid-cols-[1.55fr,1fr]">
      <Card
        title={minuta.titulo}
        subtitle="Edição jurídica assistida com contexto estruturado, versionamento e trilha de geração."
        eyebrow="Redação"
      >
        <div className="mb-3 flex flex-wrap gap-2">
          <StatusBadge label={`minuta ${minuta.id}`} variant="neutro" />
          <StatusBadge
            label={`contexto v${versaoContextoAtual ?? contextoJuridico?.versaoContexto ?? "n/d"}`}
            variant={contextoJuridico ? "sucesso" : "alerta"}
          />
          <StatusBadge label={`${minuta.versoes.length} versões`} variant="implantacao" />
          <StatusBadge label={`${referenciasDocumentais.length} referências`} variant="neutro" />
        </div>

        <EditorToolbar editor={editor} />
        <div className="rounded-b-xl border border-t-0 border-[var(--color-border)] bg-[var(--color-card)]">
          <EditorContent editor={editor} />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={salvarRascunho}
            disabled={salvando}
            className="rounded-xl bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {salvando ? "Salvando..." : "Salvar rascunho"}
          </button>

          {selecaoTexto && pedidoId ? (
            <button
              type="button"
              onClick={() => setPainelIAAberto(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-info-border)] bg-[var(--color-info-bg)] px-4 py-2 text-sm font-semibold text-[var(--color-info-ink)]"
            >
              <SparkIcon size={14} />
              Abrir sugestão assistida
            </button>
          ) : null}

          {mensagemSalvar ? <p className="text-xs text-[var(--color-muted)]">{mensagemSalvar}</p> : null}
        </div>

        {painelIAAberto ? (
          <div className="mt-4 space-y-3 rounded-[1.2rem] border border-[var(--color-info-border)] bg-[var(--color-info-bg)] p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-[var(--color-info-ink)]">Sugestão assistida por IA</p>
              <button
                type="button"
                onClick={() => setPainelIAAberto(false)}
                className="text-xs font-semibold text-[var(--color-info-ink)]"
              >
                Fechar
              </button>
            </div>

            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-muted-strong)]">
                Trecho selecionado
              </p>
              <p className="mt-2 text-sm text-[var(--color-muted)]">{selecaoTexto}</p>
            </div>

            <TextareaInput
              label="Instrução para a IA"
              value={instrucaoIA}
              onChange={(event) => setInstrucaoIA(event.target.value)}
              rows={2}
              placeholder="Ex.: Reescreva em tom mais técnico, com maior objetividade e reforço dos fundamentos."
              helperText="Descreva claramente o ajuste desejado para o trecho selecionado."
            />

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={solicitarSugestaoIA}
                disabled={loadingIA || !instrucaoIA}
                className="rounded-xl bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {loadingIA ? "Consultando IA..." : "Gerar sugestão"}
              </button>
              {sugestaoIA ? (
                <button
                  type="button"
                  onClick={aplicarSugestaoNoEditor}
                  className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"
                >
                  Aplicar no editor
                </button>
              ) : null}
            </div>

            {sugestaoIA ? (
              <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-muted-strong)]">
                  Sugestão retornada
                </p>
                <p className="mt-2 whitespace-pre-wrap text-sm text-[var(--color-muted)]">{sugestaoIA}</p>
              </div>
            ) : null}
          </div>
        ) : null}
      </Card>

      <div className="space-y-6">
        <Card
          title="Painel operacional da minuta"
          subtitle="Contexto acionável para revisão técnica e consistência da peça."
          eyebrow="Contexto"
        >
          {!contextoJuridico ? (
            <InlineAlert title="Contexto indisponível" variant="warning">
              O contexto jurídico ainda não foi consolidado para esta minuta.
            </InlineAlert>
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
                <strong>Cronologia:</strong> {cronologia.length} evento(s)
              </p>
              <p>
                <strong>Pontos controvertidos:</strong> {pontosControvertidos.length}
              </p>
              <p>
                <strong>Referências:</strong> {referenciasDocumentais.length}
              </p>
              <p>
                <strong>Teses confirmadas:</strong> {tesesConfirmadas.length}
              </p>

              {fatosRelevantes.length > 0 ? (
                <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-muted-strong)]">
                    Fatos prioritários
                  </p>
                  <ul className="mt-2 space-y-1 text-xs text-[var(--color-muted)]">
                    {fatosRelevantes.slice(0, 4).map((fato) => (
                      <li key={fato}>{fato}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {tesesConfirmadas.length > 0 ? (
                <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-muted-strong)]">
                    Teses já validadas
                  </p>
                  <div className="mt-2 space-y-2">
                    {tesesConfirmadas.slice(0, 3).map((tese) => (
                      <div key={tese.id} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-2">
                        <p className="text-xs font-semibold text-[var(--color-ink)]">{tese.titulo}</p>
                        <p className="mt-1 text-xs text-[var(--color-muted)]">{tese.descricao}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </Card>

        <Card title="Rastro de geração" subtitle="Origem técnica da versão atual para auditoria e rastreabilidade." eyebrow="Rastro">
          {!rastroGeracaoAtual ? (
            <p className="text-sm text-[var(--color-muted)]">Geração estruturada indisponível para esta minuta.</p>
          ) : (
            <div className="space-y-2 text-sm text-[var(--color-ink)]">
              <p>
                <strong>Template:</strong> {rastroGeracaoAtual.templateNome} (v{rastroGeracaoAtual.templateVersao})
              </p>
              <p>
                <strong>Tipo canônico:</strong> {rastroGeracaoAtual.tipoPecaCanonica}
              </p>
              <p>
                <strong>Matéria canônica:</strong> {rastroGeracaoAtual.materiaCanonica}
              </p>
              <p>
                <strong>Contexto origem:</strong> v{rastroGeracaoAtual.contextoVersao ?? "n/d"}
              </p>
              <p>
                <strong>Referências usadas:</strong> {rastroGeracaoAtual.referenciasDocumentais.length}
              </p>
            </div>
          )}
        </Card>

        <Card title="Próximos passos da revisão" subtitle="Checklist operacional antes de avançar para aprovação." eyebrow="Revisão">
          <div className="space-y-2">
            {proximosPassos.map((passo) => (
              <p key={passo} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-3 py-2 text-sm text-[var(--color-muted)]">
                {passo}
              </p>
            ))}
          </div>
        </Card>

        <PainelInteligenciaJuridicaView inteligenciaJuridica={inteligenciaJuridica} />

        <Card title="Comparação entre versões" subtitle="Diferença textual entre versão selecionada e conteúdo atual." eyebrow="Versionamento">
          <SelectInput
            label="Versão de referência"
            value={versaoComparadaId}
            onChange={(event) => setVersaoComparadaId(event.target.value)}
            options={minuta.versoes.map((versao) => ({
              value: versao.id,
              label: `Versão ${versao.numero} • ${formatarDataHora(versao.criadoEm)}`,
            }))}
          />

          {versaoComparada ? (
            <div className="mt-2">
              <VersionDiff
                oldText={versaoComparada.conteudo}
                newText={conteudoAtualTexto}
                oldLabel={`Versão ${versaoComparada.numero}`}
                newLabel="Texto atual"
              />
            </div>
          ) : (
            <p className="text-sm text-[var(--color-muted)]">Selecione uma versão para comparar.</p>
          )}
        </Card>

        <Card title="Histórico de versões" subtitle="Rastro completo de alterações do documento." eyebrow="Auditoria">
          <div className="space-y-3">
            {minuta.versoes
              .slice()
              .reverse()
              .map((versao) => (
                <article key={versao.id} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-[var(--color-ink)]">Versão {versao.numero}</p>
                    <StatusBadge label="registrada" variant="sucesso" />
                  </div>
                  <p className="mt-1 text-xs text-[var(--color-muted)]">
                    {versao.autor} • {formatarDataHora(versao.criadoEm)}
                  </p>
                  <p className="mt-1 text-xs text-[var(--color-muted)]">
                    Contexto origem: v{versao.contextoVersaoOrigem ?? versaoContextoAtual ?? "n/d"}
                  </p>
                  <p className="text-xs text-[var(--color-muted)]">
                    Template: {versao.templateNomeOrigem ?? "n/d"}{" "}
                    {versao.templateVersaoOrigem ? `(v${versao.templateVersaoOrigem})` : ""}
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
