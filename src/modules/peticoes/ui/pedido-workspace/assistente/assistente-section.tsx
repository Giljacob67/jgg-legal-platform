"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { InlineAlert } from "@/components/ui/inline-alert";
import { EmptyState } from "@/components/ui/empty-state";
import { SparkIcon, SendIcon, FileIcon, ShieldCheckIcon, AlertTriangleIcon } from "@/components/ui/icons";
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
import { AnexoChatUploader } from "./anexo-chat-uploader";
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

type DocumentoAnexoChat = {
  id: string;
  titulo: string;
  tipo: string;
  status: "existente" | "novo" | "pendente" | "analisado";
  dataAnexo: string;
};

export function AssistenteSection({ pedido, documentos, dossie, contextoAtual }: AssistenteSectionProps) {
  const contextoMock = gerarContextoMock(pedido);
  const [mensagens, setMensagens] = useState<MensagemAssistente[]>(() => gerarMensagensIniciais(contextoMock));
  const [inputTexto, setInputTexto] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [anexosChat, setAnexosChat] = useState<DocumentoAnexoChat[]>(() =>
    documentos.map((d) => ({
      id: d.id,
      titulo: d.titulo,
      tipo: d.tipo,
      status: d.status === "extraído" ? "analisado" : d.status === "lido" ? "pendente" : "existente",
      dataAnexo: d.dataUpload,
    })),
  );

  const [diagnosticoDocumental, setDiagnosticoDocumental] = useState<{
    fonte: "real" | "parcial" | "simulado";
    observacoes?: string;
    nivelConfianca: "alta" | "media" | "baixa";
    documentosAnalisados: Array<{
      id: string;
      titulo: string;
      tipo: string;
      status: string;
      fatosExtraidos?: string[];
    }>;
    tipoAcaoProvavel: string;
    parteProvavelmenteRepresentada: string;
    pecaCabivelSugerida: string;
    fatosRelevantes: string[];
    pontosControvertidos: string[];
    riscosFragilidades: string[];
    documentosFatosFaltantes: string[];
    perguntasMinimas: string[];
    proximaAcaoRecomendada: string;
  } | null>(null);
  const [analiseReutilizada, setAnaliseReutilizada] = useState(false);
  const [dataAnalise, setDataAnalise] = useState<string | null>(null);
  const [identificacaoPeca, setIdentificacaoPeca] = useState<{
    pecaCabivel: string;
    tipoAcaoProvavel: string;
    faseProcessualProvavel: string;
    parteProvavelmenteRepresentada: string;
    poloProvavel: "ativo" | "passivo" | "indefinido";
    grauConfianca: "alta" | "media" | "baixa";
    fundamentosDaInferencia: string[];
    pontosDeIncerteza: string[];
    perguntasDeConfirmacao: string[];
    proximaAcaoRecomendada: string;
    podeAvancarParaEstrategia: boolean;
    fonte: "real" | "parcial" | "simulado";
    observacoes?: string;
  } | null>(null);
  const [identificacaoReutilizada, setIdentificacaoReutilizada] = useState(false);
  const [dataIdentificacao, setDataIdentificacao] = useState<string | null>(null);
  const [estrategia, setEstrategia] = useState<{
    estrategiaRecomendada: string;
    objetivoProcessual: string;
    linhaArgumentativaPrincipal: string;
    tesesPrincipais: Array<{ titulo: string; fundamentoLegal: string; prioridade: string }>;
    tesesSubsidiarias: Array<{ titulo: string; fundamentoLegal: string }>;
    pedidosRecomendados: string[];
    pedidosArriscados: string[];
    riscosEFragilidades: string[];
    pontosAEvitar: string[];
    provasEDocumentosDeApoio: string[];
    perguntasPendentes: string[];
    nivelConfianca: "alta" | "media" | "baixa";
    podeAvancarParaMinuta: boolean;
    proximaAcaoRecomendada: string;
    fonte: "real" | "parcial" | "simulado";
    observacoes?: string;
  } | null>(null);
  const [estrategiaReutilizada, setEstrategiaReutilizada] = useState(false);
  const [dataEstrategia, setDataEstrategia] = useState<string | null>(null);
  const [confirmacaoEstrategia, setConfirmacaoEstrategia] = useState<{
    estrategiaAprovada: boolean;
    parteRepresentadaConfirmada: string;
    pecaCabivelConfirmada: string;
    tesesAprovadas: string[];
    tesesRejeitadas: string[];
    pedidosObrigatorios: string[];
    pedidosRemovidos: string[];
    riscosAceitos: string[];
    ressalvasDoAdvogado: string[];
    informacoesPendentesIgnoradas: string[];
    observacoes?: string;
    podeAvancarParaMinuta: boolean;
    confirmadoEm: string;
    fonte: "real" | "parcial" | "simulado";
  } | null>(null);
  const [aguardandoConfirmacao, setAguardandoConfirmacao] = useState(false);
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
    async (acaoId: string) => {
      setCarregando(true);
      enviarMensagem(`Executando ação: ${ACOES_RAPIDAS.find((a) => a.id === acaoId)?.titulo ?? acaoId}...`, "usuario");

      if (acaoId === "analisar-documentos") {
        const loadingId = `msg-${acaoId}-loading-${Date.now()}`;
        setMensagens((prev) => [
          ...prev,
          {
            id: loadingId,
            tipo: "sistema",
            titulo: "Análise documental em andamento",
            conteudo: "Sincronizando pipeline, processando documentos vinculados e gerando diagnóstico estruturado. Aguarde...",
            acaoId,
            timestamp: new Date().toISOString(),
          },
        ]);

        try {
          const res = await fetch(`/api/peticoes/pipeline/${pedido.id}/analisar-documentos`, {
            method: "POST",
          });
          const data = (await res.json()) as {
            diagnostico: {
              fonte: "real" | "parcial" | "simulado";
              observacoes?: string;
              nivelConfianca: "alta" | "media" | "baixa";
              documentosAnalisados: Array<{
                id: string;
                titulo: string;
                tipo: string;
                status: string;
                fatosExtraidos?: string[];
              }>;
              tipoAcaoProvavel: string;
              parteProvavelmenteRepresentada: string;
              pecaCabivelSugerida: string;
              fatosRelevantes: string[];
              pontosControvertidos: string[];
              riscosFragilidades: string[];
              documentosFatosFaltantes: string[];
              perguntasMinimas: string[];
              proximaAcaoRecomendada: string;
            };
            reutilizado: boolean;
            criadoEm: string;
          };

          if (!res.ok) {
            throw new Error("Falha na análise documental");
          }

          const diag = data.diagnostico;
          setDiagnosticoDocumental(diag);
          setAnaliseReutilizada(data.reutilizado ?? false);
          setDataAnalise(data.criadoEm ?? new Date().toISOString());

          setAnexosChat((prev) =>
            prev.map((doc) => {
              const analisado = diag.documentosAnalisados.find((d) => d.id === doc.id);
              if (analisado) {
                return { ...doc, status: "analisado" as const };
              }
              return doc;
            }),
          );

          setMensagens((prev) => {
            const filtered = prev.filter((m) => m.id !== loadingId);
            const lines = [
              `Tipo de ação provável: ${diag.tipoAcaoProvavel}`,
              `Parte representada: ${diag.parteProvavelmenteRepresentada}`,
              `Peça cabível sugerida: ${diag.pecaCabivelSugerida}`,
              "",
              "Fatos relevantes extraídos:",
              ...diag.fatosRelevantes.map((f) => `• ${f}`),
              "",
              "Pontos controvertidos:",
              ...diag.pontosControvertidos.map((f) => `• ${f}`),
              "",
              "Riscos ou fragilidades:",
              ...diag.riscosFragilidades.map((f) => `• ${f}`),
              "",
              "Documentos/fatos faltantes:",
              ...diag.documentosFatosFaltantes.map((f) => `• ${f}`),
              "",
              "Perguntas mínimas para o advogado:",
              ...diag.perguntasMinimas.map((f) => `• ${f}`),
              "",
              `Próxima ação recomendada: ${diag.proximaAcaoRecomendada}`,
            ];
            lines.push("", `Nível de confiança: ${diag.nivelConfianca.toUpperCase()}`);
            lines.push(`Fonte: ${diag.fonte}${diag.observacoes ? ` — ${diag.observacoes}` : ""}`);
            const newMessages: MensagemAssistente[] = [
              {
                id: `msg-${acaoId}-result-${Date.now()}`,
                tipo: "diagnostico",
                titulo: "Diagnóstico Documental",
                conteudo: lines.join("\n"),
                acaoId,
                timestamp: new Date().toISOString(),
              },
            ];
            return [...filtered, ...newMessages];
          });
        } catch (err) {
          setMensagens((prev) => {
            const filtered = prev.filter((m) => m.id !== loadingId);
            return [
              ...filtered,
              {
                id: `msg-${acaoId}-error-${Date.now()}`,
                tipo: "alerta",
                titulo: "Erro na análise documental",
                conteudo: err instanceof Error ? err.message : "Não foi possível concluir a análise. Tente novamente ou use o pipeline técnico.",
                acaoId,
                timestamp: new Date().toISOString(),
              },
            ];
          });
          setAnaliseReutilizada(false);
          setDataAnalise(null);
          const respostas = gerarRespostaAcao(acaoId, contextoMock);
          setMensagens((prev) => [...prev, ...respostas]);
        } finally {
          setCarregando(false);
        }
        return;
      }

      if (acaoId === "identificar-peca") {
        const loadingId = `msg-${acaoId}-loading-${Date.now()}`;
        setMensagens((prev) => [
          ...prev,
          {
            id: loadingId,
            tipo: "sistema",
            titulo: "Identificando peça cabível",
            conteudo: "Recuperando diagnóstico documental, analisando contexto do caso e inferindo a peça jurídica mais adequada. Aguarde...",
            acaoId,
            timestamp: new Date().toISOString(),
          },
        ]);

        try {
          const res = await fetch(`/api/peticoes/pipeline/${pedido.id}/identificar-peca`, {
            method: "POST",
          });
          const data = (await res.json()) as {
            identificacao: {
              pecaCabivel: string;
              tipoAcaoProvavel: string;
              faseProcessualProvavel: string;
              parteProvavelmenteRepresentada: string;
              poloProvavel: "ativo" | "passivo" | "indefinido";
              grauConfianca: "alta" | "media" | "baixa";
              fundamentosDaInferencia: string[];
              pontosDeIncerteza: string[];
              perguntasDeConfirmacao: string[];
              proximaAcaoRecomendada: string;
              podeAvancarParaEstrategia: boolean;
              fonte: "real" | "parcial" | "simulado";
              observacoes?: string;
            };
            reutilizado: boolean;
            criadoEm: string;
          };

          if (!res.ok) {
            throw new Error("Falha na identificação de peça cabível");
          }

          const ident = data.identificacao;
          setIdentificacaoPeca(ident);
          setIdentificacaoReutilizada(data.reutilizado ?? false);
          setDataIdentificacao(data.criadoEm ?? new Date().toISOString());

          setMensagens((prev) => {
            const filtered = prev.filter((m) => m.id !== loadingId);
            const lines = [
              `Peça cabível: ${ident.pecaCabivel}`,
              `Tipo de ação provável: ${ident.tipoAcaoProvavel}`,
              `Fase processual: ${ident.faseProcessualProvavel}`,
              `Parte representada: ${ident.parteProvavelmenteRepresentada}`,
              `Polo provável: ${ident.poloProvavel.toUpperCase()}`,
              `Grau de confiança: ${ident.grauConfianca.toUpperCase()}`,
              "",
              "Fundamentos da inferência:",
              ...ident.fundamentosDaInferencia.map((f) => `• ${f}`),
              "",
              "Pontos de incerteza:",
              ...ident.pontosDeIncerteza.map((f) => `• ${f}`),
              "",
              "Perguntas de confirmação:",
              ...ident.perguntasDeConfirmacao.map((f) => `• ${f}`),
              "",
              `Próxima ação recomendada: ${ident.proximaAcaoRecomendada}`,
              ident.podeAvancarParaEstrategia
                ? "✅ Pode avançar para estratégia"
                : "⚠️ Não avance para estratégia sem confirmação do advogado",
            ];
            lines.push("", `Fonte: ${ident.fonte}${ident.observacoes ? ` — ${ident.observacoes}` : ""}`);
            const newMessages: MensagemAssistente[] = [
              {
                id: `msg-${acaoId}-result-${Date.now()}`,
                tipo: "acao",
                titulo: "Peça cabível identificada",
                conteudo: lines.join("\n"),
                acaoId,
                timestamp: new Date().toISOString(),
              },
            ];
            return [...filtered, ...newMessages];
          });
        } catch (err) {
          setMensagens((prev) => {
            const filtered = prev.filter((m) => m.id !== loadingId);
            return [
              ...filtered,
              {
                id: `msg-${acaoId}-error-${Date.now()}`,
                tipo: "alerta",
                titulo: "Erro na identificação de peça cabível",
                conteudo: err instanceof Error ? err.message : "Não foi possível identificar a peça. Tente novamente.",
                acaoId,
                timestamp: new Date().toISOString(),
              },
            ];
          });
          setIdentificacaoReutilizada(false);
          setDataIdentificacao(null);
          const respostas = gerarRespostaAcao(acaoId, contextoMock);
          setMensagens((prev) => [...prev, ...respostas]);
        } finally {
          setCarregando(false);
        }
        return;
      }

      if (acaoId === "sugerir-estrategia") {
        const loadingId = `msg-${acaoId}-loading-${Date.now()}`;
        setMensagens((prev) => [
          ...prev,
          {
            id: loadingId,
            tipo: "sistema",
            titulo: "Sugerindo estratégia",
            conteudo: "Recuperando diagnóstico, identificação de peça e elaborando estratégia jurídica. Aguarde...",
            acaoId,
            timestamp: new Date().toISOString(),
          },
        ]);

        try {
          const res = await fetch(`/api/peticoes/pipeline/${pedido.id}/sugerir-estrategia`, {
            method: "POST",
          });
          const data = (await res.json()) as {
            estrategia: {
              estrategiaRecomendada: string;
              objetivoProcessual: string;
              linhaArgumentativaPrincipal: string;
              tesesPrincipais: Array<{ titulo: string; fundamentoLegal: string; prioridade: string }>;
              tesesSubsidiarias: Array<{ titulo: string; fundamentoLegal: string }>;
              pedidosRecomendados: string[];
              pedidosArriscados: string[];
              riscosEFragilidades: string[];
              pontosAEvitar: string[];
              provasEDocumentosDeApoio: string[];
              perguntasPendentes: string[];
              nivelConfianca: "alta" | "media" | "baixa";
              podeAvancarParaMinuta: boolean;
              proximaAcaoRecomendada: string;
              fonte: "real" | "parcial" | "simulado";
              observacoes?: string;
            } | null;
            reutilizado: boolean;
            criadoEm: string;
            mensagem?: string;
            dependenciasFaltantes?: string[];
          };

          if (!res.ok) {
            throw new Error("Falha na sugestão de estratégia");
          }

          if (!data.estrategia) {
            setMensagens((prev) => {
              const filtered = prev.filter((m) => m.id !== loadingId);
              return [
                ...filtered,
                {
                  id: `msg-${acaoId}-deps-${Date.now()}`,
                  tipo: "alerta",
                  titulo: "Dependências pendentes",
                  conteudo: data.mensagem ?? "É necessário executar etapas anteriores antes de sugerir estratégia.",
                  acaoId,
                  timestamp: new Date().toISOString(),
                },
              ];
            });
            setCarregando(false);
            return;
          }

          const est = data.estrategia;
          setEstrategia(est);
          setEstrategiaReutilizada(data.reutilizado ?? false);
          setDataEstrategia(data.criadoEm ?? new Date().toISOString());

          setMensagens((prev) => {
            const filtered = prev.filter((m) => m.id !== loadingId);
            const lines = [
              `Estratégia: ${est.estrategiaRecomendada}`,
              `Objetivo: ${est.objetivoProcessual}`,
              `Linha argumentativa: ${est.linhaArgumentativaPrincipal}`,
              "",
              "Teses principais:",
              ...est.tesesPrincipais.map((t) => `• ${t.titulo} (${t.prioridade}) — ${t.fundamentoLegal}`),
              "",
              "Teses subsidiárias:",
              ...est.tesesSubsidiarias.map((t) => `• ${t.titulo} — ${t.fundamentoLegal}`),
              "",
              "Pedidos recomendados:",
              ...est.pedidosRecomendados.map((p) => `• ${p}`),
              "",
              "Riscos:",
              ...est.riscosEFragilidades.map((r) => `• ${r}`),
              "",
              "Pontos a evitar:",
              ...est.pontosAEvitar.map((p) => `• ${p}`),
              "",
              `Próxima ação: ${est.proximaAcaoRecomendada}`,
              est.podeAvancarParaMinuta
                ? "\u2705 Pode avançar para minuta (com revisão humana)"
                : "\u26a0\ufe0f Não avance para minuta sem confirmação",
            ];
            lines.push("", `Nível de confiança: ${est.nivelConfianca.toUpperCase()}`);
            lines.push(`Fonte: ${est.fonte}${est.observacoes ? ` — ${est.observacoes}` : ""}`);
            const newMessages: MensagemAssistente[] = [
              {
                id: `msg-${acaoId}-result-${Date.now()}`,
                tipo: "acao",
                titulo: "Estratégia sugerida",
                conteudo: lines.join("\n"),
                acaoId,
                timestamp: new Date().toISOString(),
              },
              {
                id: `msg-${acaoId}-confirm-prompt-${Date.now()}`,
                tipo: "sistema",
                titulo: "Confirmação necessária",
                conteudo:
                  est.podeAvancarParaMinuta
                    ? `A estratégia está fundamentada. Você pode aprovar, ajustar ou ressalvar. Digite sua resposta (ex: "aprovo", "rejeito a tese X", "inclua pedido Y").`
                    : `Há pendências ou incertezas. Responda antes de avançar (ex: "confirme o polo", "ignore a falta do documento").`,
                acaoId,
                timestamp: new Date().toISOString(),
              },
            ];
            setAguardandoConfirmacao(true);
            return [...filtered, ...newMessages];
          });
        } catch (err) {
          setMensagens((prev) => {
            const filtered = prev.filter((m) => m.id !== loadingId);
            return [
              ...filtered,
              {
                id: `msg-${acaoId}-error-${Date.now()}`,
                tipo: "alerta",
                titulo: "Erro na sugestão de estratégia",
                conteudo: err instanceof Error ? err.message : "Não foi possível sugerir estratégia. Tente novamente.",
                acaoId,
                timestamp: new Date().toISOString(),
              },
            ];
          });
          setEstrategiaReutilizada(false);
          setDataEstrategia(null);
          const respostas = gerarRespostaAcao(acaoId, contextoMock);
          setMensagens((prev) => [...prev, ...respostas]);
        } finally {
          setCarregando(false);
        }
        return;
      }

      setTimeout(() => {
        const respostas = gerarRespostaAcao(acaoId, contextoMock);
        setMensagens((prev) => [...prev, ...respostas]);
        setCarregando(false);
      }, 1200);
    },
    [contextoMock, enviarMensagem, pedido.id],
  );

  const handleSubmit = useCallback(
    async () => {
      if (!inputTexto.trim() || carregando) return;
      const texto = inputTexto.trim();
      setInputTexto("");
      enviarMensagem(texto, "usuario");

      // Se houver estratégia pendente de confirmação, envia para API de confirmação
      if (aguardandoConfirmacao && estrategia) {
        setCarregando(true);
        try {
          const res = await fetch(`/api/peticoes/pipeline/${pedido.id}/confirmar-estrategia`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ respostaAdvogado: texto }),
          });
          const data = (await res.json()) as {
            confirmacao: {
              estrategiaAprovada: boolean;
              parteRepresentadaConfirmada: string;
              pecaCabivelConfirmada: string;
              tesesAprovadas: string[];
              tesesRejeitadas: string[];
              pedidosObrigatorios: string[];
              pedidosRemovidos: string[];
              riscosAceitos: string[];
              ressalvasDoAdvogado: string[];
              informacoesPendentesIgnoradas: string[];
              observacoes?: string;
              podeAvancarParaMinuta: boolean;
              confirmadoEm: string;
              fonte: "real" | "parcial" | "simulado";
            } | null;
            mensagem?: string;
          };

          if (!res.ok || !data.confirmacao) {
            setMensagens((prev) => [
              ...prev,
              {
                id: `msg-confirm-error-${Date.now()}`,
                tipo: "alerta",
                titulo: "Erro na confirmação",
                conteudo: data.mensagem ?? "Não foi possível processar a confirmação.",
                timestamp: new Date().toISOString(),
              },
            ]);
            setCarregando(false);
            return;
          }

          const conf = data.confirmacao;
          setConfirmacaoEstrategia(conf);
          setAguardandoConfirmacao(false);

          const lines = [
            conf.estrategiaAprovada
              ? "\u2705 Estratégia aprovada pelo advogado"
              : "\u26a0\ufe0f Estratégia não aprovada ou com ressalvas",
            `Parte confirmada: ${conf.parteRepresentadaConfirmada}`,
            `Peça confirmada: ${conf.pecaCabivelConfirmada}`,
            "",
            "Teses aprovadas:",
            ...conf.tesesAprovadas.map((t) => `• ${t}`),
            "",
            "Ressalvas:",
            ...conf.ressalvasDoAdvogado.map((r) => `• ${r}`),
            "",
            conf.podeAvancarParaMinuta
              ? "\u2705 Pode avançar para minuta"
              : "\u26a0\ufe0f Não avance para minuta sem resolver pendências",
            `Próxima ação: ${conf.podeAvancarParaMinuta ? "Redigir minuta" : "Resolver pendências e reconfirmar"}`,
          ];
          if (conf.observacoes) {
            lines.push("", `Observações: ${conf.observacoes}`);
          }

          setMensagens((prev) => [
            ...prev,
            {
              id: `msg-confirm-result-${Date.now()}`,
              tipo: conf.estrategiaAprovada ? "acao" : "alerta",
              titulo: conf.estrategiaAprovada ? "Confirmação registrada" : "Confirmação com ressalvas",
              conteudo: lines.join("\n"),
              timestamp: new Date().toISOString(),
            },
          ]);
        } catch (err) {
          setMensagens((prev) => [
            ...prev,
            {
              id: `msg-confirm-error-${Date.now()}`,
              tipo: "alerta",
              titulo: "Erro na confirmação",
              conteudo: err instanceof Error ? err.message : "Erro de conexão.",
              timestamp: new Date().toISOString(),
            },
          ]);
        } finally {
          setCarregando(false);
        }
        return;
      }

      setCarregando(true);
      setTimeout(() => {
        const resposta = gerarRespostaTextoLivre(texto);
        setMensagens((prev) => [...prev, resposta]);
        setCarregando(false);
      }, 800);
    },
    [inputTexto, carregando, enviarMensagem, aguardandoConfirmacao, estrategia, pedido.id],
  );

  const handleDocumentoAnexado = useCallback(
    (doc: { id: string; titulo: string; tipo: string; status: string }) => {
      setAnexosChat((prev) => [
        ...prev,
        {
          id: doc.id,
          titulo: doc.titulo,
          tipo: doc.tipo,
          status: "novo",
          dataAnexo: new Date().toISOString(),
        },
      ]);

      enviarMensagem(`Anexei o documento "${doc.titulo}" ao pedido.`, "usuario");

      setTimeout(() => {
        setMensagens((prev) => [
          ...prev,
          {
            id: `msg-doc-${Date.now()}`,
            tipo: "acao",
            titulo: "Documento recebido",
            conteudo: `Documento "${doc.titulo}" recebido e vinculado ao pedido. Posso analisá-lo para extrair fatos relevantes, identificar lacunas probatórias ou comparar com documentos já existentes.`,
            timestamp: new Date().toISOString(),
          },
        ]);
        setCarregando(false);
      }, 600);
    },
    [enviarMensagem],
  );

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
            <StatusBadge label="dados simulados" variant="neutro" />
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

          {/* Campo de entrada + upload */}
          <div className="mt-4 space-y-3">
            <AnexoChatUploader
              pedidoId={pedido.id}
              casoId={pedido.casoId}
              onAnexar={handleDocumentoAnexado}
            />

            <div className="flex gap-2">
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

        <Card title="Fontes de contexto" subtitle={`${anexosChat.length} documento(s) disponível(is).`} eyebrow="Docs">
          {anexosChat.length === 0 ? (
            <p className="text-sm text-[var(--color-muted)]">Nenhum documento vinculado ao pedido.</p>
          ) : (
            <div className="space-y-2">
              {anexosChat.map((doc) => (
                <div
                  key={doc.id}
                  className={cn(
                    "flex items-center gap-2 rounded-xl border p-2",
                    doc.status === "novo"
                      ? "border-emerald-200 bg-emerald-50"
                      : doc.status === "analisado"
                        ? "border-[var(--color-border)] bg-[var(--color-surface-alt)]"
                        : doc.status === "pendente"
                          ? "border-amber-200 bg-amber-50"
                          : "border-[var(--color-border)] bg-[var(--color-surface-alt)]",
                  )}
                >
                  <FileIcon size={14} className="shrink-0 text-[var(--color-muted)]" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-[var(--color-ink)]">{doc.titulo}</p>
                    <div className="mt-0.5 flex items-center gap-1">
                      <span className="text-[10px] text-[var(--color-muted)]">{doc.tipo}</span>
                      {doc.status === "novo" && (
                        <span className="flex items-center gap-0.5 text-[10px] font-medium text-emerald-700">
                          <ShieldCheckIcon size={10} /> Novo
                        </span>
                      )}
                      {doc.status === "pendente" && (
                        <span className="flex items-center gap-0.5 text-[10px] font-medium text-amber-700">
                          <AlertTriangleIcon size={10} /> Pendente
                        </span>
                      )}
                      {doc.status === "analisado" && (
                        <span className="flex items-center gap-0.5 text-[10px] font-medium text-[var(--color-accent)]">
                          <ShieldCheckIcon size={10} /> Analisado
                        </span>
                      )}
                      {doc.status === "existente" && (
                        <span className="text-[10px] text-[var(--color-muted)]">Existente</span>
                      )}
                    </div>
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

        {confirmacaoEstrategia ? (
          <Card
            title={confirmacaoEstrategia.estrategiaAprovada ? "Estratégia aprovada" : "Estratégia com ressalvas"}
            subtitle={`${confirmacaoEstrategia.podeAvancarParaMinuta ? "\u2705 Pode avançar" : "\u26a0\ufe0f Pendente"} • ${formatarDataHora(confirmacaoEstrategia.confirmadoEm)}`}
            eyebrow="Confirmação"
          >
            <div className="space-y-2 text-sm">
              <div className="flex justify-between gap-2">
                <span className="text-[var(--color-muted)]">Parte</span>
                <span className="text-right font-semibold text-[var(--color-ink)]">{confirmacaoEstrategia.parteRepresentadaConfirmada}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-[var(--color-muted)]">Peça</span>
                <span className="font-semibold text-[var(--color-ink)]">{confirmacaoEstrategia.pecaCabivelConfirmada}</span>
              </div>
              {confirmacaoEstrategia.tesesAprovadas.length > 0 && (
                <div className="mt-3 space-y-1">
                  <p className="text-xs font-semibold text-emerald-700">Teses aprovadas</p>
                  {confirmacaoEstrategia.tesesAprovadas.slice(0, 3).map((t, i) => (
                    <p key={i} className="text-xs text-[var(--color-muted)]">• {t}</p>
                  ))}
                </div>
              )}
              {confirmacaoEstrategia.ressalvasDoAdvogado.length > 0 && (
                <div className="mt-3 space-y-1">
                  <p className="text-xs font-semibold text-amber-700">Ressalvas</p>
                  {confirmacaoEstrategia.ressalvasDoAdvogado.slice(0, 3).map((r, i) => (
                    <p key={i} className="text-xs text-[var(--color-muted)]">• {r}</p>
                  ))}
                </div>
              )}
              {confirmacaoEstrategia.pedidosRemovidos.length > 0 && (
                <div className="mt-3 space-y-1">
                  <p className="text-xs font-semibold text-rose-700">Removidos</p>
                  {confirmacaoEstrategia.pedidosRemovidos.slice(0, 3).map((p, i) => (
                    <p key={i} className="text-xs text-[var(--color-muted)]">• {p}</p>
                  ))}
                </div>
              )}
            </div>
          </Card>
        ) : null}

        {estrategia ? (
          <Card
            title={estrategiaReutilizada ? "Estratégia reutilizada" : "Estratégia sugerida"}
            subtitle={`Confiança: ${estrategia.nivelConfianca.toUpperCase()}${estrategiaReutilizada ? " • Reutilizado" : ""}`}
            eyebrow="Estratégia"
          >
            {dataEstrategia ? (
              <p className="mb-2 text-[10px] text-[var(--color-muted)]">
                {estrategiaReutilizada ? "Última sugestão: " : "Sugerido em: "}
                {formatarDataHora(dataEstrategia)}
              </p>
            ) : null}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between gap-2">
                <span className="text-[var(--color-muted)]">Objetivo</span>
                <span className="text-right font-semibold text-[var(--color-ink)]">{estrategia.objetivoProcessual}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-[var(--color-muted)]">Linha</span>
                <span className="font-semibold text-[var(--color-ink)]">{estrategia.linhaArgumentativaPrincipal}</span>
              </div>
              {estrategia.tesesPrincipais.length > 0 && (
                <div className="mt-3 space-y-1">
                  <p className="text-xs font-semibold text-[var(--color-ink)]">Teses principais</p>
                  {estrategia.tesesPrincipais.slice(0, 2).map((t, i) => (
                    <p key={i} className="text-xs text-[var(--color-muted)]">• {t.titulo}</p>
                  ))}
                </div>
              )}
              {estrategia.riscosEFragilidades.length > 0 && (
                <div className="mt-3 space-y-1">
                  <p className="text-xs font-semibold text-amber-700">Riscos</p>
                  {estrategia.riscosEFragilidades.slice(0, 3).map((f, i) => (
                    <p key={i} className="text-xs text-[var(--color-muted)]">• {f}</p>
                  ))}
                </div>
              )}
              <div className="mt-3 flex items-center gap-1">
                {estrategia.podeAvancarParaMinuta ? (
                  <span className="text-[10px] font-medium text-emerald-700">\u2705 Pode avançar para minuta</span>
                ) : (
                  <span className="text-[10px] font-medium text-amber-700">\u26a0\ufe0f Aguardando confirmação</span>
                )}
              </div>
            </div>
          </Card>
        ) : null}

        {identificacaoPeca ? (
          <Card
            title={identificacaoReutilizada ? "Peça reutilizada" : "Peça cabível"}
            subtitle={`Confiança: ${identificacaoPeca.grauConfianca.toUpperCase()}${identificacaoReutilizada ? " • Reutilizado" : ""}`}
            eyebrow="Peça"
          >
            {dataIdentificacao ? (
              <p className="mb-2 text-[10px] text-[var(--color-muted)]">
                {identificacaoReutilizada ? "Última identificação: " : "Identificado em: "}
                {formatarDataHora(dataIdentificacao)}
              </p>
            ) : null}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between gap-2">
                <span className="text-[var(--color-muted)]">Peça</span>
                <span className="text-right font-semibold text-[var(--color-ink)]">{identificacaoPeca.pecaCabivel}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-[var(--color-muted)]">Ação</span>
                <span className="font-semibold text-[var(--color-ink)]">{identificacaoPeca.tipoAcaoProvavel}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-[var(--color-muted)]">Fase</span>
                <span className="font-semibold text-[var(--color-ink)]">{identificacaoPeca.faseProcessualProvavel}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-[var(--color-muted)]">Polo</span>
                <span className="font-semibold text-[var(--color-ink)]">{identificacaoPeca.poloProvavel.toUpperCase()}</span>
              </div>
              {identificacaoPeca.pontosDeIncerteza.length > 0 && (
                <div className="mt-3 space-y-1">
                  <p className="text-xs font-semibold text-amber-700">Pontos de incerteza</p>
                  {identificacaoPeca.pontosDeIncerteza.slice(0, 3).map((f, i) => (
                    <p key={i} className="text-xs text-[var(--color-muted)]">• {f}</p>
                  ))}
                </div>
              )}
              {identificacaoPeca.perguntasDeConfirmacao.length > 0 && (
                <div className="mt-3 space-y-1">
                  <p className="text-xs font-semibold text-[var(--color-ink)]">Confirmações pendentes</p>
                  {identificacaoPeca.perguntasDeConfirmacao.slice(0, 3).map((f, i) => (
                    <p key={i} className="text-xs text-[var(--color-muted)]">• {f}</p>
                  ))}
                </div>
              )}
              <div className="mt-3 flex items-center gap-1">
                {identificacaoPeca.podeAvancarParaEstrategia ? (
                  <>
                    <span className="text-[10px] font-medium text-emerald-700">✅ Pode avançar para estratégia</span>
                  </>
                ) : (
                  <span className="text-[10px] font-medium text-amber-700">⚠️ Aguardando confirmação do advogado</span>
                )}
              </div>
            </div>
          </Card>
        ) : null}

        {diagnosticoDocumental ? (
          <Card
            title={analiseReutilizada ? "Diagnóstico reutilizado" : "Diagnóstico da análise"}
            subtitle={`Fonte: ${diagnosticoDocumental.fonte} • Confiança: ${diagnosticoDocumental.nivelConfianca.toUpperCase()}${analiseReutilizada ? " • Reutilizado" : ""}`}
            eyebrow="Análise"
          >
            {dataAnalise ? (
              <p className="mb-2 text-[10px] text-[var(--color-muted)]">
                {analiseReutilizada ? "Última análise: " : "Analisado em: "}
                {formatarDataHora(dataAnalise)}
              </p>
            ) : null}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between gap-2">
                <span className="text-[var(--color-muted)]">Ação provável</span>
                <span className="text-right font-semibold text-[var(--color-ink)]">{diagnosticoDocumental.tipoAcaoProvavel}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-[var(--color-muted)]">Parte</span>
                <span className="font-semibold text-[var(--color-ink)]">{diagnosticoDocumental.parteProvavelmenteRepresentada}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-[var(--color-muted)]">Peça sugerida</span>
                <span className="font-semibold text-[var(--color-ink)]">{diagnosticoDocumental.pecaCabivelSugerida}</span>
              </div>
              <div className="mt-3 space-y-1">
                <p className="text-xs font-semibold text-[var(--color-ink)]">Documentos analisados ({diagnosticoDocumental.documentosAnalisados.length})</p>
                {diagnosticoDocumental.documentosAnalisados.map((d) => (
                  <p key={d.id} className="text-xs text-[var(--color-muted)]">• {d.titulo}</p>
                ))}
              </div>
              {diagnosticoDocumental.fatosRelevantes.length > 0 && (
                <div className="mt-3 space-y-1">
                  <p className="text-xs font-semibold text-[var(--color-ink)]">Fatos extraídos</p>
                  {diagnosticoDocumental.fatosRelevantes.slice(0, 3).map((f, i) => (
                    <p key={i} className="text-xs text-[var(--color-muted)]">• {f}</p>
                  ))}
                </div>
              )}
              {diagnosticoDocumental.riscosFragilidades.length > 0 && (
                <div className="mt-3 space-y-1">
                  <p className="text-xs font-semibold text-[var(--color-ink)]">Riscos</p>
                  {diagnosticoDocumental.riscosFragilidades.slice(0, 3).map((f, i) => (
                    <p key={i} className="text-xs text-[var(--color-muted)]">• {f}</p>
                  ))}
                </div>
              )}
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
