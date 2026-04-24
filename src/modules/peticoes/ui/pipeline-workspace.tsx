"use client";

import { useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import type {
  ContextoJuridicoPedido,
  EtapaPipeline,
  EtapaPipelineInfo,
  HistoricoPipeline,
  SnapshotPipelineEtapa,
} from "@/modules/peticoes/domain/types";
import type { ProntidaoAprovacao } from "@/modules/peticoes/application/avaliarProntidaoAprovacao";
import { MAPA_ESTAGIO_PIPELINE, type EstagioExecutavel } from "@/modules/peticoes/domain/types";
import {
  avaliarSlaDaEtapa,
  calcularDiasRestantesPrazo,
  responsavelObrigatorioAtendido,
} from "@/modules/peticoes/application/governanca-pedido";
import {
  perfilTemAlcadaAprovacao,
  perfilTemAlcadaExecucaoEstagio,
} from "@/modules/peticoes/domain/aprovacao";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { InlineAlert } from "@/components/ui/inline-alert";
import { formatarDataHora } from "@/lib/utils";
import { AuditoriaAprovacaoPanel } from "@/modules/peticoes/ui/auditoria-aprovacao-panel";
import { MapaTesesPanel } from "@/modules/peticoes/ui/mapa-teses-panel";
import { DossieJuridicoPanel } from "@/modules/peticoes/ui/dossie-juridico-panel";

type PipelineWorkspaceProps = {
  pedidoId: string;
  etapas: EtapaPipelineInfo[];
  etapaInicial: EtapaPipeline;
  historico: HistoricoPipeline[];
  snapshots: SnapshotPipelineEtapa[];
  contextoAtual: ContextoJuridicoPedido | null;
  responsavel: string;
  prazoFinal: string;
  pedidoCriadoEm: string;
  perfilUsuario?: string;
  prontidaoAprovacao?: ProntidaoAprovacao;
};

type ResultadoAprovacao = "aprovado" | "rejeitado" | "revisao_pendente";
type MacroPipelineId = "intake" | "leitura" | "analise" | "estrutura" | "redacao" | "fechamento";

const PIPELINE_PARA_ESTAGIO = Object.fromEntries(
  Object.entries(MAPA_ESTAGIO_PIPELINE).map(([key, value]) => [value, key as EstagioExecutavel]),
) as Partial<Record<EtapaPipeline, EstagioExecutavel>>;

const LABEL_ACAO_ESTAGIO: Record<EstagioExecutavel, string> = {
  triagem: "Executar triagem",
  "extracao-fatos": "Extrair fatos e provas",
  "analise-adversa": "Executar análise adversa",
  estrategia: "Consolidar diagnóstico",
  minuta: "Gerar minuta base",
};

const MACRO_PIPELINE: Array<{ id: MacroPipelineId; titulo: string; descricao: string }> = [
  {
    id: "intake",
    titulo: "Intake",
    descricao: "Triagem do pedido, objetivo processual e enquadramento inicial.",
  },
  {
    id: "leitura",
    titulo: "Leitura e fatos",
    descricao: "Leitura documental, fatos relevantes e cobertura probatória mínima.",
  },
  {
    id: "analise",
    titulo: "Análise estratégica",
    descricao: "Análise adversa, diagnóstico do caso e teses candidatas.",
  },
  {
    id: "estrutura",
    titulo: "Estruturação",
    descricao: "Organização da peça, pedidos prioritários e prova de suporte.",
  },
  {
    id: "redacao",
    titulo: "Redação",
    descricao: "Produção da minuta com base na estrutura aprovada.",
  },
  {
    id: "fechamento",
    titulo: "Fechamento",
    descricao: "Revisão jurídica, auditoria e decisão formal de aprovação.",
  },
];

const ETAPA_GUIA: Record<
  EtapaPipeline,
  {
    macro: MacroPipelineId;
    tituloCurto: string;
    objetivo: string;
    entrega: string;
    proximaLigacao: string;
  }
> = {
  classificacao: {
    macro: "intake",
    tituloCurto: "Triagem jurídica",
    objetivo: "Enquadrar o pedido, o tipo de peça e o objetivo processual de saída.",
    entrega: "Pedido classificado e pronto para leitura documental.",
    proximaLigacao: "Abre a leitura estruturada dos documentos do caso.",
  },
  leitura_documental: {
    macro: "leitura",
    tituloCurto: "Leitura documental",
    objetivo: "Medir cobertura documental e identificar lacunas antes da análise.",
    entrega: "Base documental minimamente auditável para fatos e estratégia.",
    proximaLigacao: "Alimenta a matriz de fatos e provas.",
  },
  extracao_de_fatos: {
    macro: "leitura",
    tituloCurto: "Fatos e provas",
    objetivo: "Consolidar fatos relevantes, cronologia e lastro probatório do pedido.",
    entrega: "Matriz factual inicial com eventos, fatos e pontos controvertidos.",
    proximaLigacao: "Prepara a leitura crítica da tese adversa.",
  },
  analise_adversa: {
    macro: "analise",
    tituloCurto: "Análise adversa",
    objetivo: "Antecipar ataques da parte contrária, riscos e fragilidades da nossa narrativa.",
    entrega: "Mapa de vulnerabilidades, riscos e argumentos adversos previstos.",
    proximaLigacao: "Refina o diagnóstico estratégico e evita teses frágeis.",
  },
  analise_documental_do_cliente: {
    macro: "analise",
    tituloCurto: "Confronto documental",
    objetivo: "Cruzar a prova do cliente com os fatos controvertidos já mapeados.",
    entrega: "Leitura mais defensável da prova disponível e das lacunas remanescentes.",
    proximaLigacao: "Sustenta a escolha de teses e pedidos prioritários.",
  },
  estrategia_juridica: {
    macro: "analise",
    tituloCurto: "Diagnóstico estratégico",
    objetivo: "Transformar leitura + fatos + análise adversa em direção estratégica do caso.",
    entrega: "Diagnóstico e teses candidatas para validação humana.",
    proximaLigacao: "Quando validado, destrava a estrutura da peça.",
  },
  pesquisa_de_apoio: {
    macro: "analise",
    tituloCurto: "Pesquisa de apoio",
    objetivo: "Agregar precedentes, doutrina e repertório de suporte à tese escolhida.",
    entrega: "Apoio argumentativo para reforço da peça final.",
    proximaLigacao: "Enriquece fundamentos e reduz fragilidade na redação.",
  },
  redacao: {
    macro: "redacao",
    tituloCurto: "Redação da minuta",
    objetivo: "Converter a estrutura aprovada em peça redigida com pedidos e fundamentos coerentes.",
    entrega: "Minuta base pronta para revisão jurídica.",
    proximaLigacao: "Entra em revisão e auditoria final.",
  },
  revisao: {
    macro: "fechamento",
    tituloCurto: "Revisão técnica",
    objetivo: "Checar coerência, checklist obrigatório, referências e aderência à estrutura da peça.",
    entrega: "Minuta auditada para decisão final de aprovação.",
    proximaLigacao: "Destrava ou bloqueia a aprovação formal.",
  },
  aprovacao: {
    macro: "fechamento",
    tituloCurto: "Aprovação formal",
    objetivo: "Registrar a decisão humana final sobre a peça e seu fechamento operacional.",
    entrega: "Decisão auditável de aprovação, revisão pendente ou rejeição.",
    proximaLigacao: "Fecha o ciclo da peça e prepara protocolo/baixa.",
  },
};

function macroAtualDaEtapa(etapa: EtapaPipeline): MacroPipelineId {
  return ETAPA_GUIA[etapa].macro;
}

function toStatus(
  etapa: EtapaPipelineInfo,
  snapshot: SnapshotPipelineEtapa | undefined,
  etapaAtual: EtapaPipeline,
): { label: string; variant: "sucesso" | "alerta" | "neutro" | "implantacao" | "mock"; isMock: boolean } {
  if (snapshot) {
    if (snapshot.status === "concluido") return { label: "concluída", variant: "sucesso", isMock: false };
    if (snapshot.status === "erro") return { label: "erro", variant: "alerta", isMock: false };
    if (snapshot.status === "em_andamento") return { label: "em andamento", variant: "implantacao", isMock: false };
    if (snapshot.status === "mock_controlado") return { label: "simulada", variant: "mock", isMock: true };
  }

  if (etapa.id === etapaAtual) return { label: "em andamento", variant: "implantacao", isMock: false };
  if (!etapa.priorizadaMvp) return { label: "simulada", variant: "mock", isMock: true };
  return { label: "pendente", variant: "neutro", isMock: false };
}

function resumirSaidaEstruturada(snapshot: SnapshotPipelineEtapa | undefined): string {
  if (!snapshot) return "Sem snapshot registrado para esta etapa.";
  if (snapshot.status === "erro") return snapshot.mensagemErro ?? "Falha técnica sem detalhe registrado.";

  const saida = snapshot.saidaEstruturada;
  const pares = Object.entries(saida);
  if (pares.length === 0) return "Execução sem saída estruturada relevante.";

  const resumo = pares.slice(0, 3).map(([chave, valor]) => {
    if (Array.isArray(valor)) return `${chave}: ${valor.length}`;
    if (typeof valor === "object" && valor !== null) return `${chave}: objeto`;
    return `${chave}: ${String(valor).slice(0, 36)}`;
  });

  return resumo.join(" • ");
}

export function PipelineWorkspace({
  pedidoId,
  etapas,
  etapaInicial,
  historico,
  snapshots,
  contextoAtual,
  responsavel,
  prazoFinal,
  pedidoCriadoEm,
  perfilUsuario,
  prontidaoAprovacao,
}: PipelineWorkspaceProps) {
  const router = useRouter();
  const [streamingEstagio, setStreamingEstagio] = useState<EstagioExecutavel | null>(null);
  const [streamTexts, setStreamTexts] = useState<Partial<Record<EstagioExecutavel, string>>>({});
  const [streamErrors, setStreamErrors] = useState<Partial<Record<EstagioExecutavel, string>>>({});
  const [aprovacaoObservacoes, setAprovacaoObservacoes] = useState("");
  const [aprovacaoStatus, setAprovacaoStatus] = useState<"idle" | "loading" | "sucesso" | "erro">("idle");
  const [aprovacaoMensagem, setAprovacaoMensagem] = useState<string | null>(null);

  const podeAprovar = perfilTemAlcadaAprovacao(perfilUsuario);
  const podeExecutarEstagios = perfilTemAlcadaExecucaoEstagio(perfilUsuario, "triagem");
  const responsavelDefinido = responsavelObrigatorioAtendido(responsavel);

  const executarEstagio = useCallback(
    async (estagio: EstagioExecutavel) => {
      setStreamingEstagio(estagio);
      setStreamErrors((prev) => ({ ...prev, [estagio]: undefined }));
      setStreamTexts((prev) => ({ ...prev, [estagio]: "" }));

      try {
        const res = await fetch(`/api/peticoes/pipeline/${pedidoId}/executar/${estagio}`, {
          method: "POST",
        });

        if (!res.ok) {
          const err = (await res.json()) as { error?: string };
          setStreamErrors((prev) => ({ ...prev, [estagio]: err.error ?? "Erro desconhecido" }));
          return;
        }

        const reader = res.body?.getReader();
        if (!reader) return;
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          setStreamTexts((prev) => ({
            ...prev,
            [estagio]: (prev[estagio] ?? "") + decoder.decode(value),
          }));
        }

        router.refresh();
      } catch (err) {
        setStreamErrors((prev) => ({
          ...prev,
          [estagio]: err instanceof Error ? err.message : "Erro desconhecido",
        }));
      } finally {
        setStreamingEstagio(null);
      }
    },
    [pedidoId, router],
  );

  const enviarAprovacao = useCallback(
    async (resultado: ResultadoAprovacao) => {
      setAprovacaoStatus("loading");
      setAprovacaoMensagem(null);

      try {
        const res = await fetch(`/api/peticoes/pipeline/${pedidoId}/aprovacao`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ resultado, observacoes: aprovacaoObservacoes || undefined }),
        });
        const data = (await res.json()) as { error?: string };

        if (!res.ok) {
          setAprovacaoStatus("erro");
          setAprovacaoMensagem(data.error ?? "Erro ao registrar aprovação.");
          return;
        }

        setAprovacaoStatus("sucesso");
        setAprovacaoMensagem(
          resultado === "aprovado"
            ? "Minuta aprovada com sucesso."
            : resultado === "rejeitado"
              ? "Minuta rejeitada. Solicitar revisão ao responsável."
              : "Pendência de revisão registrada.",
        );
        router.refresh();
      } catch (err) {
        setAprovacaoStatus("erro");
        setAprovacaoMensagem(err instanceof Error ? err.message : "Erro desconhecido.");
      }
    },
    [pedidoId, aprovacaoObservacoes, router],
  );

  const snapshotsMap = useMemo(() => {
    const map = new Map<EtapaPipeline, SnapshotPipelineEtapa>();
    for (const snapshot of snapshots) {
      if (!map.has(snapshot.etapa)) {
        map.set(snapshot.etapa, snapshot);
      }
    }
    return map;
  }, [snapshots]);

  const resumoPipeline = useMemo(() => {
    let concluidas = 0;
    let comErro = 0;
    let simuladas = 0;

    for (const etapa of etapas) {
      const status = toStatus(etapa, snapshotsMap.get(etapa.id), etapaInicial);
      if (status.label === "concluída") concluidas += 1;
      if (status.label === "erro") comErro += 1;
      if (status.isMock) simuladas += 1;
    }

    const percentual = etapas.length > 0 ? Math.round((concluidas / etapas.length) * 100) : 0;
    const proximaEtapa = etapas.find((etapa) => {
      const status = toStatus(etapa, snapshotsMap.get(etapa.id), etapaInicial);
      return status.label === "pendente" || status.label === "em andamento" || status.label === "erro";
    });

    return {
      concluidas,
      comErro,
      simuladas,
      percentual,
      proximaEtapa: proximaEtapa?.nome ?? "Fluxo concluído",
      proximaEtapaId: proximaEtapa?.id,
    };
  }, [etapas, etapaInicial, snapshotsMap]);

  const pendencias = useMemo(() => {
    const itens: string[] = [];

    const erros = Array.from(snapshotsMap.values()).filter((item) => item.status === "erro");
    if (erros.length > 0) {
      itens.push(`${erros.length} etapa(s) com erro técnico pendente de reexecução.`);
    }

    if (!contextoAtual) {
      itens.push("Contexto jurídico consolidado ainda não foi gerado.");
    } else if (contextoAtual.validacaoHumanaTesesPendente) {
      itens.push("Validação humana de teses pendente. A aprovação final permanece bloqueada.");
    }

    if (!podeExecutarEstagios) {
      itens.push("Execução dos estágios depende de perfil com alçada operacional jurídica.");
    }
    if (!podeAprovar) {
      itens.push("Aprovação final depende de perfil com alçada de coordenação/sócio/administração.");
    }
    if (!responsavelDefinido) {
      itens.push("Responsável obrigatório pendente. Defina o titular do pedido para executar e aprovar etapas.");
    }

    return itens;
  }, [contextoAtual, podeAprovar, podeExecutarEstagios, responsavelDefinido, snapshotsMap]);

  const slaEtapaAtual = useMemo(
    () =>
      avaliarSlaDaEtapa({
        etapa: etapaInicial,
        pedidoCriadoEm,
        snapshots,
      }),
    [etapaInicial, pedidoCriadoEm, snapshots],
  );

  const diasRestantes = useMemo(() => calcularDiasRestantesPrazo(prazoFinal), [prazoFinal]);
  const macroAtual = macroAtualDaEtapa(etapaInicial);
  const macroIndex = MACRO_PIPELINE.findIndex((item) => item.id === macroAtual);

  const historicoOrdenado = useMemo(
    () => historico.slice().sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()),
    [historico],
  );

  return (
    <div className="grid gap-6 xl:grid-cols-[1.55fr,1fr]">
      <div className="space-y-6">
        <Card
          title="Andamento do pipeline"
          subtitle="Esteira jurídica progressiva do pedido, da triagem até a auditoria e aprovação."
          eyebrow="Execução"
        >
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
            {MACRO_PIPELINE.map((macro, index) => {
              const status =
                index < macroIndex
                  ? "concluída"
                  : index === macroIndex
                    ? "em foco"
                    : "pendente";

              return (
                <article
                  key={macro.id}
                  className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-[var(--color-ink)]">{macro.titulo}</p>
                    <StatusBadge
                      label={status}
                      variant={status === "concluída" ? "sucesso" : status === "em foco" ? "implantacao" : "neutro"}
                    />
                  </div>
                  <p className="mt-2 text-xs leading-5 text-[var(--color-muted)]">{macro.descricao}</p>
                </article>
              );
            })}
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-muted-strong)]">Concluídas</p>
              <p className="font-serif text-3xl text-[var(--color-ink)]">{resumoPipeline.concluidas}</p>
            </div>
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-muted-strong)]">Com erro</p>
              <p className="font-serif text-3xl text-[var(--color-ink)]">{resumoPipeline.comErro}</p>
            </div>
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-muted-strong)]">Simuladas</p>
              <p className="font-serif text-3xl text-[var(--color-ink)]">{resumoPipeline.simuladas}</p>
            </div>
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-muted-strong)]">Conclusão</p>
              <p className="font-serif text-3xl text-[var(--color-ink)]">{resumoPipeline.percentual}%</p>
            </div>
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-3 md:col-span-2 xl:col-span-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-muted-strong)]">Próxima etapa</p>
              <p className="mt-1 text-sm font-semibold text-[var(--color-ink)]">
                {resumoPipeline.proximaEtapaId ? ETAPA_GUIA[resumoPipeline.proximaEtapaId].tituloCurto : resumoPipeline.proximaEtapa}
              </p>
            </div>
          </div>

          <div className="mt-3 h-2 rounded-full bg-[var(--color-surface-alt)]">
            <div className="h-2 rounded-full bg-[var(--color-accent)]" style={{ width: `${resumoPipeline.percentual}%` }} />
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-2">
            {etapas.map((etapa, index) => {
              const snapshot = snapshotsMap.get(etapa.id);
              const status = toStatus(etapa, snapshot, etapaInicial);
              const guia = ETAPA_GUIA[etapa.id];
              const estagioExecutavel = PIPELINE_PARA_ESTAGIO[etapa.id];
              const streamKey = estagioExecutavel as EstagioExecutavel;
              const podeExecutarEtapa = estagioExecutavel
                ? perfilTemAlcadaExecucaoEstagio(perfilUsuario, estagioExecutavel)
                : false;

              return (
                <article key={etapa.id} className="rounded-[1.2rem] border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-muted-strong)]">
                        {MACRO_PIPELINE.find((item) => item.id === guia.macro)?.titulo}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-[var(--color-ink)]">
                        {index + 1}. {guia.tituloCurto}
                      </p>
                      <p className="mt-1 text-xs text-[var(--color-muted)]">
                        {guia.objetivo}
                      </p>
                      <p className="mt-2 text-xs text-[var(--color-muted)]">
                        {status.isMock
                          ? "Etapa em simulação controlada nesta versão."
                          : etapa.priorizadaMvp
                            ? "Etapa priorizada para execução nesta fase."
                            : "Etapa visível para evolução futura."}
                      </p>
                    </div>
                    <StatusBadge label={status.label} variant={status.variant} />
                  </div>

                  {snapshot ? (
                    <p className="mt-2 text-xs text-[var(--color-muted)]">
                      Última execução: {formatarDataHora(snapshot.executadoEm)} • v{snapshot.versao} • tentativa {snapshot.tentativa}
                    </p>
                  ) : null}

                  <p className="mt-2 text-xs text-[var(--color-muted)]">{resumirSaidaEstruturada(snapshot)}</p>

                  <div className="mt-3 space-y-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-muted-strong)]">
                      Entrega esperada
                    </p>
                    <p className="text-sm text-[var(--color-muted)]">{guia.entrega}</p>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-muted-strong)]">
                      Como alimenta a próxima fase
                    </p>
                    <p className="text-sm text-[var(--color-muted)]">{guia.proximaLigacao}</p>
                  </div>

                  {estagioExecutavel ? (
                    <div className="mt-3 space-y-2">
                      <button
                        type="button"
                        onClick={() => executarEstagio(estagioExecutavel)}
                        disabled={
                          streamingEstagio !== null ||
                          status.isMock ||
                          !responsavelDefinido ||
                          !podeExecutarEtapa
                        }
                        className="rounded-xl bg-[var(--color-accent)] px-3 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {status.isMock
                          ? "Etapa simulada"
                          : !podeExecutarEtapa
                            ? "Sem alçada para execução"
                          : !responsavelDefinido
                            ? "Defina o responsável para executar"
                          : streamingEstagio === estagioExecutavel
                            ? "Executando IA..."
                            : LABEL_ACAO_ESTAGIO[estagioExecutavel]}
                      </button>

                      {streamErrors[streamKey] ? (
                        <InlineAlert title="Falha na execução" variant="warning">
                          {streamErrors[streamKey]}
                        </InlineAlert>
                      ) : null}

                      {streamTexts[streamKey] ? (
                        <pre className="max-h-56 overflow-y-auto whitespace-pre-wrap rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-3 text-xs text-[var(--color-ink)]">
                          {streamTexts[streamKey]}
                        </pre>
                      ) : null}
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        </Card>

        <Card title="Timeline de execução" subtitle="Eventos ordenados por data para leitura rápida de andamento." eyebrow="Rastro">
          {historicoOrdenado.length === 0 ? (
            <p className="text-sm text-[var(--color-muted)]">Sem eventos registrados até o momento.</p>
          ) : (
            <div className="space-y-3">
              {historicoOrdenado.map((item) => (
                <article key={item.id} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-[var(--color-ink)]">{item.descricao}</p>
                    <p className="text-xs text-[var(--color-muted)]">{formatarDataHora(item.data)}</p>
                  </div>
                    <p className="mt-1 text-xs text-[var(--color-muted)]">
                    Etapa: {ETAPA_GUIA[item.etapa].tituloCurto} • Responsável: {item.responsavel}
                  </p>
                </article>
              ))}
            </div>
          )}
        </Card>

        <MapaTesesPanel pedidoId={pedidoId} contextoAtual={contextoAtual} compact />
      </div>

      <div className="space-y-6">
        <Card title="Visão operacional" subtitle="Leitura rápida para coordenação de trabalho e destravamento de fluxo." eyebrow="Gestão">
          <div className="space-y-2 text-sm text-[var(--color-ink)]">
            <p>
              <strong>Etapa atual:</strong> {ETAPA_GUIA[etapaInicial].tituloCurto}
            </p>
            <p>
              <strong>Macrofase:</strong> {MACRO_PIPELINE.find((item) => item.id === macroAtual)?.titulo}
            </p>
            <p>
              <strong>Responsável:</strong> {responsavel || "não definido"}
            </p>
            <p>
              <strong>Prazo final:</strong>{" "}
              {diasRestantes < 0 ? `vencido há ${Math.abs(diasRestantes)} dia(s)` : `${diasRestantes} dia(s) restantes`}
            </p>
            <p>
              <strong>SLA da etapa:</strong> {slaEtapaAtual.diasConsumidos}/{slaEtapaAtual.diasSla} dia(s) •{" "}
              {slaEtapaAtual.status === "estourado"
                ? "estourado"
                : slaEtapaAtual.status === "atencao"
                  ? "em atenção"
                  : "dentro do limite"}
            </p>
            <p>
              <strong>Próxima etapa sugerida:</strong>{" "}
              {resumoPipeline.proximaEtapaId ? ETAPA_GUIA[resumoPipeline.proximaEtapaId].tituloCurto : resumoPipeline.proximaEtapa}
            </p>
            <p>
              <strong>Snapshots ativos:</strong> {snapshots.length}
            </p>
          </div>

          <div className="mt-4 space-y-2">
            {pendencias.length > 0 ? (
              pendencias.map((item) => (
                <InlineAlert key={item} title="Ponto de atenção" variant="warning">
                  {item}
                </InlineAlert>
              ))
            ) : (
              <InlineAlert title="Sem bloqueios relevantes" variant="success">
                O pipeline está em curso com dados consolidados para decisão.
              </InlineAlert>
            )}
          </div>
        </Card>

        <DossieJuridicoPanel contextoAtual={contextoAtual} compact />

        <Card
          title="Aprovação da minuta"
          subtitle={
            podeAprovar
              ? "Registre a decisão formal de aprovação, rejeição ou solicitação de revisão."
              : "Somente coordenadores, sócios e administradores podem aprovar minutas."
          }
          eyebrow="Governança"
        >
          {!podeAprovar ? (
            <p className="text-sm text-[var(--color-muted)]">Seu perfil não possui alçada para aprovação final.</p>
          ) : !responsavelDefinido ? (
            <InlineAlert title="Aprovação bloqueada" variant="warning">
              Defina o responsável do pedido antes de registrar aprovação.
            </InlineAlert>
          ) : contextoAtual?.validacaoHumanaTesesPendente ? (
            <InlineAlert title="Aprovação bloqueada" variant="warning">
              Valide as teses inferidas pelo sistema ou registre tese manual antes da decisão final.
            </InlineAlert>
          ) : prontidaoAprovacao && !prontidaoAprovacao.liberado ? (
            <div className="space-y-4">
              <AuditoriaAprovacaoPanel prontidao={prontidaoAprovacao} compact />
              <InlineAlert title="Aprovação bloqueada" variant="warning">
                Corrija os itens de auditoria acima antes de registrar a decisão final.
              </InlineAlert>
            </div>
          ) : (
            <div className="space-y-4">
              {prontidaoAprovacao ? <AuditoriaAprovacaoPanel prontidao={prontidaoAprovacao} compact /> : null}
              <div>
                <label className="mb-1 block text-xs font-medium text-[var(--color-ink)]">Observações (opcional)</label>
                <textarea
                  value={aprovacaoObservacoes}
                  onChange={(event) => setAprovacaoObservacoes(event.target.value)}
                  disabled={aprovacaoStatus === "loading"}
                  rows={3}
                  placeholder="Registre comentários, ressalvas ou instruções de revisão."
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-3 py-2 text-sm text-[var(--color-ink)] outline-none"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => enviarAprovacao("aprovado")}
                  disabled={aprovacaoStatus === "loading" || contextoAtual?.validacaoHumanaTesesPendente}
                  className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {aprovacaoStatus === "loading" ? "Registrando..." : "Aprovar"}
                </button>
                <button
                  type="button"
                  onClick={() => enviarAprovacao("revisao_pendente")}
                  disabled={aprovacaoStatus === "loading" || contextoAtual?.validacaoHumanaTesesPendente}
                  className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-4 py-2 text-sm font-semibold text-[var(--color-ink)] disabled:opacity-50"
                >
                  Solicitar revisão
                </button>
                <button
                  type="button"
                  onClick={() => enviarAprovacao("rejeitado")}
                  disabled={aprovacaoStatus === "loading" || contextoAtual?.validacaoHumanaTesesPendente}
                  className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                >
                  Rejeitar
                </button>
              </div>

              {aprovacaoMensagem ? (
                <InlineAlert
                  title={aprovacaoStatus === "sucesso" ? "Aprovação registrada" : "Falha ao registrar aprovação"}
                  variant={aprovacaoStatus === "sucesso" ? "success" : "warning"}
                >
                  {aprovacaoMensagem}
                </InlineAlert>
              ) : null}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
