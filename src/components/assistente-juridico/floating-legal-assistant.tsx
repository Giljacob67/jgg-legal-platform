"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { ChatIcon, SendIcon, SparkIcon, XIcon } from "@/components/ui/icons";
import { StatusBadge } from "@/components/ui/status-badge";
import { InlineAlert } from "@/components/ui/inline-alert";

type ChatMensagem = {
  id: string;
  papel: "user" | "assistant";
  texto: string;
};

type ContextoRota = {
  modulo?: string;
  casoId?: string;
  pedidoId?: string;
  minutaId?: string;
};

const MENSAGEM_INICIAL: ChatMensagem = {
  id: "assistente-inicial",
  papel: "assistant",
  texto:
    "Sou seu assistente jurídico de apoio operacional. Posso ajudar com teses, estrutura de peça, fundamentos e checklist processual. Sempre valide a estratégia final com o advogado responsável.",
};

const MAX_HISTORICO = 6;

function gerarId(prefixo: string) {
  return `${prefixo}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

function isEntityId(segmento?: string): boolean {
  if (!segmento) return false;
  return /^[A-Z]{3}-\d{4}-\d{3,}$/.test(segmento);
}

function inferirContextoDaRota(pathname: string): ContextoRota {
  const segmentos = pathname.split("/").filter(Boolean);
  const modulo = segmentos[0];
  if (!modulo) return {};

  const contexto: ContextoRota = { modulo };

  if (modulo === "casos" && isEntityId(segmentos[1])) {
    contexto.casoId = segmentos[1];
    return contexto;
  }

  if (modulo !== "peticoes") {
    return contexto;
  }

  if (segmentos[1] === "pedidos" && isEntityId(segmentos[2])) {
    contexto.pedidoId = segmentos[2];
    return contexto;
  }

  if (segmentos[1] === "pipeline" && isEntityId(segmentos[2])) {
    contexto.pedidoId = segmentos[2];
    return contexto;
  }

  if (segmentos[1] === "minutas" && isEntityId(segmentos[2])) {
    contexto.minutaId = segmentos[2];
    return contexto;
  }

  return contexto;
}

function formatarContextoAtivo(contexto: ContextoRota): string {
  if (contexto.minutaId) return `Minuta ${contexto.minutaId}`;
  if (contexto.pedidoId) return `Pedido ${contexto.pedidoId}`;
  if (contexto.casoId) return `Caso ${contexto.casoId}`;
  if (contexto.modulo) return `Módulo ${contexto.modulo}`;
  return "Sem contexto específico";
}

export function FloatingLegalAssistant() {
  const pathname = usePathname();
  const containerRef = useRef<HTMLDivElement>(null);

  const [aberto, setAberto] = useState(false);
  const [entrada, setEntrada] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [mensagens, setMensagens] = useState<ChatMensagem[]>([MENSAGEM_INICIAL]);

  const podeEnviar = entrada.trim().length > 0 && !enviando;
  const contextoRota = useMemo(() => inferirContextoDaRota(pathname), [pathname]);
  const contextoAtivoLabel = useMemo(() => formatarContextoAtivo(contextoRota), [contextoRota]);

  const historicoApi = useMemo(
    () =>
      mensagens
        .slice(-MAX_HISTORICO)
        .map((msg) => ({ role: msg.papel, content: msg.texto })),
    [mensagens],
  );

  useEffect(() => {
    if (!aberto) return;
    const node = containerRef.current;
    if (!node) return;
    node.scrollTop = node.scrollHeight;
  }, [mensagens, aberto]);

  async function enviarPergunta() {
    const pergunta = entrada.trim();
    if (!pergunta || enviando) return;

    const mensagemUsuario: ChatMensagem = { id: gerarId("user"), papel: "user", texto: pergunta };
    setMensagens((prev) => [...prev, mensagemUsuario]);
    setEntrada("");
    setEnviando(true);
    setErro(null);

    try {
      const resposta = await fetch("/api/agents/assistente-juridico", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pergunta,
          contextoRota: pathname,
          contextoEntidades: contextoRota,
          historico: [...historicoApi, { role: "user", content: pergunta }],
        }),
      });

      const payload = (await resposta.json()) as { resposta?: string; error?: string };
      if (!resposta.ok) {
        throw new Error(payload.error ?? "Não foi possível responder agora.");
      }

      setMensagens((prev) => [
        ...prev,
        {
          id: gerarId("assistant"),
          papel: "assistant",
          texto:
            payload.resposta?.trim() ||
            "Não consegui gerar uma resposta útil agora. Tente reformular a pergunta com mais contexto.",
        },
      ]);
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Erro inesperado ao consultar assistente.");
      setMensagens((prev) => [
        ...prev,
        {
          id: gerarId("assistant"),
          papel: "assistant",
          texto: "Falha de conexão no assistente. Revise a configuração de IA em Administração > Configurações.",
        },
      ]);
    } finally {
      setEnviando(false);
    }
  }

  function limparConversa() {
    setMensagens([MENSAGEM_INICIAL]);
    setErro(null);
  }

  return (
    <>
      {aberto ? (
        <div className="fixed inset-x-3 bottom-3 z-50 sm:inset-x-auto sm:right-6 sm:w-[420px]">
          <section className="overflow-hidden rounded-[1.35rem] border border-[var(--color-border-strong)] bg-[var(--color-card)] shadow-[var(--shadow-shell)]">
            <header className="flex items-start justify-between gap-3 border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-alt)] px-4 py-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-[var(--color-ink)]">Assistente Jurídico IA</p>
                  <StatusBadge label="Beta" variant="neutro" />
                </div>
                <p className="mt-1 text-xs text-[var(--color-muted)]">
                  Apoio técnico em dúvidas jurídicas e estratégia processual.
                </p>
                <p className="mt-1 text-[11px] font-medium text-[var(--color-muted)]">
                  Contexto ativo: {contextoAtivoLabel}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAberto(false)}
                aria-label="Fechar assistente"
                className="rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-1.5 text-[var(--color-muted)] hover:text-[var(--color-ink)]"
              >
                <XIcon size={14} />
              </button>
            </header>

            <div className="space-y-3 border-b border-[var(--color-border-subtle)] px-4 py-3">
              <InlineAlert title="Uso responsável" variant="info">
                Respostas informativas para apoio operacional. Decisão final e validação jurídica permanecem humanas.
              </InlineAlert>
              {erro ? (
                <InlineAlert title="Falha na consulta" variant="warning">
                  {erro}
                </InlineAlert>
              ) : null}
            </div>

            <div
              ref={containerRef}
              className="max-h-[46vh] min-h-[240px] space-y-3 overflow-y-auto px-4 py-3 sm:max-h-[430px]"
            >
              {mensagens.map((mensagem) => (
                <article
                  key={mensagem.id}
                  className={`rounded-xl border px-3 py-2 text-sm leading-6 ${
                    mensagem.papel === "assistant"
                      ? "border-[var(--color-border)] bg-[var(--color-surface-alt)] text-[var(--color-ink)]"
                      : "ml-7 border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-[var(--color-ink)]"
                  }`}
                >
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-muted)]">
                    {mensagem.papel === "assistant" ? "Assistente" : "Você"}
                  </p>
                  <p className="whitespace-pre-wrap">{mensagem.texto}</p>
                </article>
              ))}
              {enviando ? (
                <article className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-3 py-2 text-sm text-[var(--color-muted)]">
                  Gerando resposta jurídica...
                </article>
              ) : null}
            </div>

            <div className="space-y-2 border-t border-[var(--color-border-subtle)] px-4 py-3">
              <textarea
                value={entrada}
                onChange={(event) => setEntrada(event.target.value)}
                placeholder="Ex.: Quais fundamentos para tutela de urgência em obrigação de fazer com risco de dano irreparável?"
                className="min-h-[94px] w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-card-strong)] px-3 py-2.5 text-sm text-[var(--color-ink)] outline-none transition placeholder:text-[var(--color-muted)] focus:border-[var(--color-accent)]"
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    void enviarPergunta();
                  }
                }}
              />
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={limparConversa}
                  className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-2.5 py-1.5 text-xs font-medium text-[var(--color-muted)] hover:text-[var(--color-ink)]"
                >
                  Limpar conversa
                </button>
                <button
                  type="button"
                  onClick={() => void enviarPergunta()}
                  disabled={!podeEnviar}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--color-accent)] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                >
                  <SendIcon size={13} />
                  {enviando ? "Enviando..." : "Perguntar"}
                </button>
              </div>
            </div>
          </section>
        </div>
      ) : null}

      {!aberto ? (
        <button
          type="button"
          onClick={() => setAberto(true)}
          aria-label="Abrir assistente jurídico"
          className="fixed bottom-6 right-6 z-40 inline-flex h-14 w-14 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-accent)] text-white shadow-[var(--shadow-shell)] transition hover:scale-[1.03]"
        >
          <span className="relative">
            <ChatIcon size={21} />
            <SparkIcon size={10} className="absolute -right-1 -top-1" />
          </span>
        </button>
      ) : null}
    </>
  );
}
