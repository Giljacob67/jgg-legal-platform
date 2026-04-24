"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { InlineAlert } from "@/components/ui/inline-alert";
import { EmptyState } from "@/components/ui/empty-state";
import { SparkIcon, SendIcon, FileIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";
import { formatarDataHora } from "@/lib/utils";
import type { PedidoWorkspaceData } from "../types";
import {
  ACOES_RAPIDAS,
  gerarContextoMock,
  gerarMensagensIniciais,
  gerarRespostaAcao,
  gerarRespostaTextoLivre,
} from "./mock-chat";
import type { MensagemAssistente } from "./types";

type AssistenteSectionProps = Pick<
  PedidoWorkspaceData,
  "pedido" | "documentos" | "dossie" | "contextoAtual"
>;

function avatarVariant(tipo: MensagemAssistente["tipo"]): { bg: string; text: string; label: string } {
  switch (tipo) {
    case "usuario":
      return { bg: "bg-[var(--color-accent)]", text: "text-white", label: "Você" };
    case "acao":
      return { bg: "bg-emerald-600", text: "text-white", label: "Ação" };
    case "diagnostico":
      return { bg: "bg-[var(--color-accent-strong)]", text: "text-white", label: "Diagnóstico" };
    case "minuta":
      return { bg: "bg-indigo-600", text: "text-white", label: "Minuta" };
    case "alerta":
      return { bg: "bg-rose-600", text: "text-white", label: "Alerta" };
    default:
      return { bg: "bg-[var(--color-muted-strong)]", text: "text-white", label: "Assistente" };
  }
}

export function AssistenteSection({ pedido, documentos, dossie, contextoAtual }: AssistenteSectionProps) {
  const contextoMock = gerarContextoMock(pedido);
  const [mensagens, setMensagens] = useState<MensagemAssistente[]>(() => gerarMensagensIniciais(contextoMock));
  const [inputTexto, setInputTexto] = useState("");
  const [carregando, setCarregando] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [mensagens]);

  const enviarMensagem = useCallback(
    (texto: string, tipo: MensagemAssistente["tipo"] = "usuario") => {
      const nova: MensagemAssistente = {
        id: `msg-user-${Date.now()}`,
        tipo,
        conteudo: texto,
        timestamp: new Date().toISOString(),
      };
      setMensagens((prev) => [...prev, nova]);
    },
    [],
  );

  const executarAcao = useCallback(
    (acaoId: string) => {
      setCarregando(true);
      enviarMensagem(`Executando ação: ${ACOES_RAPIDAS.find((a) => a.id === acaoId)?.titulo ?? acaoId}...`, "usuario");

      setTimeout(() => {
        const respostas = gerarRespostaAcao(acaoId, contextoMock);
        setMensagens((prev) => [...prev, ...respostas]);
        setCarregando(false);
      }, 1200);
    },
    [contextoMock, enviarMensagem],
  );

  const handleSubmit = useCallback(() => {
    if (!inputTexto.trim() || carregando) return;
    const texto = inputTexto.trim();
    setInputTexto("");
    enviarMensagem(texto, "usuario");

    setCarregando(true);
    setTimeout(() => {
      const resposta = gerarRespostaTextoLivre(texto);
      setMensagens((prev) => [...prev, resposta]);
      setCarregando(false);
    }, 800);
  }, [inputTexto, carregando, enviarMensagem]);

  const documentosVinculados = documentos.slice(0, 5);
  const matrizExistente = dossie?.matrizFatosEProvas ?? [];

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      {/* Área principal do chat */}
      <div className="min-w-0 flex-1 space-y-6">
        <Card
          title="Assistente Jurídico"
          subtitle="Chat com resultado — experiência experimental. Dados simulados nesta fase."
          eyebrow="IA"
        >
          <div className="flex items-center gap-2">
            <StatusBadge label="modo experimental" variant="implantacao" />
            <StatusBadge label="dados mockados" variant="neutro" />
          </div>
        </Card>

        {/* Ações rápidas */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ACOES_RAPIDAS.map((acao) => (
            <button
              key={acao.id}
              type="button"
              onClick={() => executarAcao(acao.id)}
              disabled={carregando}
              className={cn(
                "rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-4 text-left transition hover:border-[var(--color-accent)] hover:shadow-sm disabled:opacity-50",
              )}
            >
              <p className="text-lg">{acao.icone}</p>
              <p className="mt-2 text-sm font-semibold text-[var(--color-ink)]">{acao.titulo}</p>
              <p className="mt-1 text-xs text-[var(--color-muted)]">{acao.descricao}</p>
            </button>
          ))}
        </div>

        {/* Área de mensagens */}
        <Card title="Conversa" subtitle="Interação estruturada com o assistente jurídico." eyebrow="Chat">
          <div
            ref={scrollRef}
            className="flex max-h-[560px] flex-col gap-4 overflow-y-auto rounded-2xl border border-[var(--color-border)] bg-[var(--color-page)] p-4"
          >
            {mensagens.length === 0 ? (
              <EmptyState
                title="Nenhuma mensagem"
                message="Escolha uma ação rápida ou digite uma pergunta para iniciar a conversa."
                icon={<SparkIcon size={22} />}
              />
            ) : (
              mensagens.map((msg) => {
                const avatar = avatarVariant(msg.tipo);
                const isUsuario = msg.tipo === "usuario";
                return (
                  <div
                    key={msg.id}
                    className={cn(
                      "flex gap-3",
                      isUsuario ? "flex-row-reverse" : "flex-row",
                    )}
                  >
                    <div
                      className={cn(
                        "grid h-8 w-8 shrink-0 place-items-center rounded-full text-[10px] font-bold",
                        avatar.bg,
                        avatar.text,
                      )}
                    >
                      {avatar.label[0]}
                    </div>
                    <div
                      className={cn(
                        "max-w-[85%] rounded-2xl border px-4 py-3 text-sm leading-relaxed",
                        isUsuario
                          ? "border-[var(--color-accent)] bg-[var(--color-accent-soft)] text-[var(--color-ink)]"
                          : msg.tipo === "alerta"
                            ? "border-rose-200 bg-rose-50 text-rose-800"
                            : msg.tipo === "diagnostico"
                              ? "border-[var(--color-accent-soft)] bg-[var(--color-card)] text-[var(--color-ink)]"
                              : msg.tipo === "minuta"
                                ? "border-indigo-200 bg-indigo-50 text-indigo-900"
                                : "border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-ink)]",
                      )}
                    >
                      {msg.titulo ? (
                        <p className="mb-1 text-xs font-bold uppercase tracking-[0.14em] text-[var(--color-muted-strong)]">
                          {msg.titulo}
                        </p>
                      ) : null}
                      <div className="whitespace-pre-wrap">{msg.conteudo}</div>
                      <p className={cn("mt-1 text-[10px] text-[var(--color-muted)]", isUsuario ? "text-right" : "text-left")}>
                        {formatarDataHora(msg.timestamp)}
                      </p>
                    </div>
                  </div>
                );
              })
            )}

            {carregando && (
              <div className="flex gap-3">
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[var(--color-muted-strong)] text-[10px] font-bold text-white">A</div>
                <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3">
                  <div className="flex gap-1">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-[var(--color-muted)]"></span>
                    <span className="h-2 w-2 animate-bounce rounded-full bg-[var(--color-muted)] [animation-delay:0.15s]"></span>
                    <span className="h-2 w-2 animate-bounce rounded-full bg-[var(--color-muted)] [animation-delay:0.3s]"></span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Campo de entrada */}
          <div className="mt-4 flex gap-2">
            <input
              type="text"
              value={inputTexto}
              onChange={(e) => setInputTexto(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSubmit();
              }}
              placeholder="Digite uma pergunta ou instrução em linguagem natural..."
              className="flex-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-4 py-2.5 text-sm text-[var(--color-ink)] outline-none placeholder:text-[var(--color-muted)] focus:border-[var(--color-accent)]"
            />
            <button
              type="button"
              onClick={handleSubmit}
              disabled={carregando || !inputTexto.trim()}
              className="rounded-xl bg-[var(--color-accent)] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              <SendIcon size={16} />
            </button>
          </div>
        </Card>
      </div>

      {/* Painel lateral de contexto */}
      <aside className="shrink-0 space-y-6 lg:w-[300px]">
        <Card title="Contexto do caso" subtitle="Dados atuais do pedido." eyebrow="Dados">
          <div className="space-y-3 text-sm">
            <div className="flex justify-between gap-2">
              <span className="text-[var(--color-muted)]">Caso</span>
              <span className="font-semibold text-[var(--color-ink)]">{contextoMock.casoId}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-[var(--color-muted)]">Peça</span>
              <span className="font-semibold text-[var(--color-ink)]">{contextoMock.tipoPeca}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-[var(--color-muted)]">Matéria</span>
              <span className="font-semibold text-[var(--color-ink)]">{contextoMock.materia}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-[var(--color-muted)]">Polo</span>
              <span className="font-semibold text-[var(--color-ink)]">{contextoMock.polo}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-[var(--color-muted)]">Prazo</span>
              <span className="font-semibold text-[var(--color-ink)]">{contextoMock.prazoFinal}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-[var(--color-muted)]">Responsável</span>
              <span className="font-semibold text-[var(--color-ink)]">{contextoMock.responsavel}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-[var(--color-muted)]">Status</span>
              <span className="font-semibold text-[var(--color-ink)]">{contextoMock.status}</span>
            </div>
          </div>
        </Card>

        <Card title="Documentos vinculados" subtitle={`${documentos.length} documento(s) no caso.`} eyebrow="Docs">
          {documentosVinculados.length === 0 ? (
            <p className="text-sm text-[var(--color-muted)]">Nenhum documento vinculado.</p>
          ) : (
            <div className="space-y-2">
              {documentosVinculados.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-2"
                >
                  <FileIcon size={14} className="shrink-0 text-[var(--color-muted)]" />
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-[var(--color-ink)]">{doc.titulo}</p>
                    <p className="text-[10px] text-[var(--color-muted)]">{doc.tipo} • {doc.status}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card title="Base factual" subtitle="Resumo da matriz de fatos e provas." eyebrow="Fatos">
          {matrizExistente.length === 0 ? (
            <p className="text-sm text-[var(--color-muted)]">Matriz ainda não construída.</p>
          ) : (
            <div className="space-y-2">
              <div className="flex justify-between gap-2 text-sm">
                <span className="text-[var(--color-muted)]">Fatos mapeados</span>
                <span className="font-semibold text-[var(--color-ink)]">{matrizExistente.length}</span>
              </div>
              <div className="flex justify-between gap-2 text-sm">
                <span className="text-[var(--color-muted)]">Comprovados</span>
                <span className="font-semibold text-[var(--color-ink)]">{matrizExistente.filter((f) => f.grauCobertura === "forte").length}</span>
              </div>
              <div className="flex justify-between gap-2 text-sm">
                <span className="text-[var(--color-muted)]">Controversos</span>
                <span className="font-semibold text-[var(--color-ink)]">{matrizExistente.filter((f) => f.controverso).length}</span>
              </div>
            </div>
          )}
        </Card>

        {contextoAtual?.dossieJuridico?.diagnosticoEstrategico ? (
          <Card
            title="Diagnóstico atual"
            subtitle="Diretriz consolidada pelo pipeline."
            eyebrow="Estratégia"
          >
            <p className="text-sm text-[var(--color-ink)]">{contextoAtual.dossieJuridico.diagnosticoEstrategico.resumo}</p>
            <div className="mt-3 space-y-1">
              {contextoAtual.dossieJuridico.diagnosticoEstrategico.alavancas.slice(0, 3).map((a) => (
                <p key={a} className="text-xs text-[var(--color-muted)]">• {a}</p>
              ))}
            </div>
          </Card>
        ) : null}

        <InlineAlert title="Experiência experimental" variant="info">
          Esta interface é uma camada visual experimental. Os resultados são simulados e não substituem o pipeline técnico nem a análise do advogado responsável.
        </InlineAlert>
      </aside>
    </div>
  );
}
