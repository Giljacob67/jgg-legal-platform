"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Caso } from "@/modules/casos/domain/types";
import { detectarPoloRepresentado } from "@/modules/casos/domain/types";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import type { PrioridadePedido, TipoPeca } from "@/modules/peticoes/domain/types";
import {
  calcularPendencias,
  consolidarEstrategiaInicial,
  construirInputTriagemPreview,
  construirPayloadCriacao,
  criarDraftInicial,
  listarObjetivosPorCategoria,
  montarRevisaoNovoPedido,
  obterEtapaAnterior,
  obterEtapaSeguinte,
  validarEtapaWizard,
} from "@/modules/peticoes/novo-pedido/application/wizard";
import { CasoContextoStep } from "@/modules/peticoes/novo-pedido/ui/steps/caso-contexto-step";
import { DocumentosProvasStep } from "@/modules/peticoes/novo-pedido/ui/steps/documentos-provas-step";
import { EstrategiaInicialStep } from "@/modules/peticoes/novo-pedido/ui/steps/estrategia-inicial-step";
import { ObjetivoJuridicoStep } from "@/modules/peticoes/novo-pedido/ui/steps/objetivo-juridico-step";
import { RevisaoCriacaoStep } from "@/modules/peticoes/novo-pedido/ui/steps/revisao-criacao-step";
import { WizardStepper } from "@/modules/peticoes/novo-pedido/ui/wizard-stepper";
import type {
  CategoriaObjetivoJuridico,
  DocumentoSelecionadoNovoPedido,
  EtapaNovoPedidoWizard,
  NovoPedidoWizardDraft,
  SugestaoTriagemWizard,
} from "@/modules/peticoes/novo-pedido/domain/types";

type NovoPedidoWizardProps = {
  casos: Caso[];
  tiposPeca: TipoPeca[];
};

type ResultadoCriacaoState = {
  pedidoId: string;
  titulo: string;
  uploadEfetuado: number;
} | null;

function mapearArquivos(arquivos: File[]): DocumentoSelecionadoNovoPedido[] {
  return arquivos.map((arquivo) => ({
    id: `${arquivo.name}-${arquivo.size}-${arquivo.lastModified}`,
    nome: arquivo.name,
    tamanhoBytes: arquivo.size,
    mimeType: arquivo.type,
  }));
}

export function NovoPedidoWizard({ casos, tiposPeca }: NovoPedidoWizardProps) {
  const [draft, setDraft] = useState<NovoPedidoWizardDraft>(() => criarDraftInicial(casos));
  const [etapaAtual, setEtapaAtual] = useState<EtapaNovoPedidoWizard>("caso_contexto");
  const [arquivosSelecionados, setArquivosSelecionados] = useState<File[]>([]);
  const [tipoDocumentoUpload, setTipoDocumentoUpload] = useState("Petição");
  const [sugestaoTriagem, setSugestaoTriagem] = useState<SugestaoTriagemWizard | null>(null);
  const [carregandoTriagem, setCarregandoTriagem] = useState(false);
  const [erroTriagem, setErroTriagem] = useState<string | null>(null);
  const [errosEtapa, setErrosEtapa] = useState<string[]>([]);
  const [criandoPedido, setCriandoPedido] = useState(false);
  const [erroCriacao, setErroCriacao] = useState<string | null>(null);
  const [resultadoCriacao, setResultadoCriacao] = useState<ResultadoCriacaoState>(null);

  const estrategiaAtual = useMemo(
    () =>
      consolidarEstrategiaInicial({
        caso: draft.caso,
        objetivo: draft.objetivo,
        prazoFinal: draft.caso?.prazoFinal ?? "",
        documentos: draft.documentos,
        sugestaoTriagem,
        tipoPecaConfirmada: draft.estrategia.tipoPecaConfirmada,
        prioridadeConfirmada: draft.estrategia.prioridadeConfirmada,
      }),
    [
      draft.caso,
      draft.objetivo,
      draft.documentos,
      draft.estrategia.tipoPecaConfirmada,
      draft.estrategia.prioridadeConfirmada,
      sugestaoTriagem,
    ],
  );

  const draftAtual = useMemo(() => {
    const draftComEstrategia = {
      ...draft,
      estrategia: estrategiaAtual,
    };
    const pendencias = calcularPendencias(draftComEstrategia);
    const revisao = montarRevisaoNovoPedido({ ...draftComEstrategia, pendencias });
    return {
      ...draftComEstrategia,
      pendencias,
      revisao,
    };
  }, [draft, estrategiaAtual]);

  const sugestoesObjetivo = useMemo(
    () => listarObjetivosPorCategoria(draftAtual.objetivo.categoria),
    [draftAtual.objetivo.categoria],
  );

  function atualizarCasoSelecionado(casoId: string) {
    const caso = casos.find((item) => item.id === casoId) ?? null;
    setDraft((current) => ({
      ...current,
      caso,
      briefing: {
        ...current.briefing,
        casoId: caso?.id ?? "",
        tituloCaso: caso?.titulo ?? "",
        cliente: caso?.cliente ?? "",
        materia: caso?.materia ?? "",
        tribunal: caso?.tribunal ?? "",
        poloInferido: caso ? detectarPoloRepresentado(caso) : "indefinido",
      },
    }));
    setSugestaoTriagem(null);
  }

  function atualizarBriefing(campo: "contextoFatico" | "observacoesOperacionais", valor: string) {
    setDraft((current) => ({
      ...current,
      briefing: {
        ...current.briefing,
        [campo]: valor,
      },
    }));
    setSugestaoTriagem(null);
  }

  function selecionarCategoria(categoria: CategoriaObjetivoJuridico) {
    setDraft((current) => ({
      ...current,
      objetivo: {
        categoria,
        intencaoSelecionada: "",
        intencaoLivre: "",
      },
    }));
    setSugestaoTriagem(null);
  }

  function selecionarObjetivo(intencao: NovoPedidoWizardDraft["objetivo"]["intencaoSelecionada"]) {
    setDraft((current) => ({
      ...current,
      objetivo: {
        ...current.objetivo,
        intencaoSelecionada: intencao,
        intencaoLivre: intencao === "outro" ? current.objetivo.intencaoLivre : "",
      },
    }));
    setSugestaoTriagem(null);
  }

  function atualizarIntencaoLivre(valor: string) {
    setDraft((current) => ({
      ...current,
      objetivo: {
        ...current.objetivo,
        intencaoLivre: valor,
      },
    }));
    setSugestaoTriagem(null);
  }

  function confirmarTipoPeca(tipoPeca: TipoPeca) {
    setDraft((current) => ({
      ...current,
      estrategia: {
        ...current.estrategia,
        tipoPecaConfirmada: tipoPeca,
      },
    }));
  }

  function confirmarPrioridade(prioridade: PrioridadePedido) {
    setDraft((current) => ({
      ...current,
      estrategia: {
        ...current.estrategia,
        prioridadeConfirmada: prioridade,
      },
    }));
  }

  function atualizarArquivos(arquivos: File[]) {
    setArquivosSelecionados((current) => {
      const mapa = new Map<string, File>();
      for (const arquivo of [...current, ...arquivos]) {
        mapa.set(`${arquivo.name}-${arquivo.size}-${arquivo.lastModified}`, arquivo);
      }
      return [...mapa.values()];
    });
  }

  useEffect(() => {
    setDraft((current) => ({
      ...current,
      documentos: mapearArquivos(arquivosSelecionados),
    }));
  }, [arquivosSelecionados]);

  function removerArquivo(documentoId: string) {
    setArquivosSelecionados((current) =>
      current.filter((arquivo) => `${arquivo.name}-${arquivo.size}-${arquivo.lastModified}` !== documentoId),
    );
  }

  function alternarConfirmacao(valor: boolean) {
    setDraft((current) => ({
      ...current,
      confirmacao: {
        ...current.confirmacao,
        confirmadoPeloUsuario: valor,
      },
    }));
  }

  function atualizarObservacoesFinais(valor: string) {
    setDraft((current) => ({
      ...current,
      confirmacao: {
        ...current.confirmacao,
        observacoesFinais: valor,
      },
    }));
  }

  const atualizarSugestoesTriagem = useCallback(async () => {
    setCarregandoTriagem(true);
    setErroTriagem(null);

    try {
      const response = await fetch("/api/agents/triagem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(construirInputTriagemPreview(draftAtual)),
      });

      const data = (await response.json()) as {
        error?: string;
        triagem?: SugestaoTriagemWizard;
        modo?: "ai" | "mock";
      };

      if (!response.ok || !data.triagem) {
        throw new Error(data.error ?? "Não foi possível gerar sugestões para este briefing.");
      }

      setSugestaoTriagem({
        ...data.triagem,
        modo: data.modo ?? data.triagem.modo,
      });
    } catch (error) {
      setErroTriagem(error instanceof Error ? error.message : "Falha inesperada ao atualizar sugestões.");
    } finally {
      setCarregandoTriagem(false);
    }
  }, [draftAtual]);

  useEffect(() => {
    if (etapaAtual !== "estrategia_inicial") {
      return;
    }

    if (!draftAtual.briefing.contextoFatico.trim() || !draftAtual.objetivo.intencaoSelecionada) {
      return;
    }

    if (sugestaoTriagem || carregandoTriagem) {
      return;
    }

    void atualizarSugestoesTriagem();
  }, [
    atualizarSugestoesTriagem,
    carregandoTriagem,
    draftAtual.briefing.contextoFatico,
    draftAtual.objetivo.intencaoSelecionada,
    etapaAtual,
    sugestaoTriagem,
  ]);

  function avancarEtapa() {
    const erros = validarEtapaWizard(etapaAtual, draftAtual);
    setErrosEtapa(erros);
    if (erros.length > 0) {
      return;
    }

    const proximaEtapa = obterEtapaSeguinte(etapaAtual);
    if (proximaEtapa) {
      setEtapaAtual(proximaEtapa);
      setErrosEtapa([]);
    }
  }

  function voltarEtapa() {
    const etapaAnterior = obterEtapaAnterior(etapaAtual);
    if (etapaAnterior) {
      setEtapaAtual(etapaAnterior);
      setErrosEtapa([]);
    }
  }

  async function enviarArquivosAposCriacao(pedidoId: string) {
    let uploadEfetuado = 0;

    for (const arquivo of arquivosSelecionados) {
      const formData = new FormData();
      formData.set("file", arquivo);
      formData.set("titulo", arquivo.name.replace(/\.[^.]+$/, ""));
      formData.set("tipoDocumento", tipoDocumentoUpload);
      formData.set(
        "vinculos",
        JSON.stringify([
          { tipoEntidade: "caso", entidadeId: draftAtual.briefing.casoId, papel: "principal" },
          { tipoEntidade: "pedido_peca", entidadeId: pedidoId, papel: "apoio" },
        ]),
      );

      const response = await fetch("/api/documentos/upload", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        uploadEfetuado += 1;
      }
    }

    return uploadEfetuado;
  }

  async function criarPedidoFinal() {
    const erros = validarEtapaWizard("revisao_criacao", draftAtual);
    setErrosEtapa(erros);
    setErroCriacao(null);
    if (erros.length > 0) {
      return;
    }

    setCriandoPedido(true);

    try {
      const payload = construirPayloadCriacao(draftAtual);
      const response = await fetch("/api/peticoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as {
        error?: string;
        pedido?: { id: string; titulo: string };
      };

      if (!response.ok || !data.pedido) {
        throw new Error(data.error ?? "Não foi possível criar o pedido.");
      }

      const uploadEfetuado = await enviarArquivosAposCriacao(data.pedido.id);
      setResultadoCriacao({
        pedidoId: data.pedido.id,
        titulo: data.pedido.titulo,
        uploadEfetuado,
      });
    } catch (error) {
      setErroCriacao(error instanceof Error ? error.message : "Erro inesperado ao criar pedido.");
    } finally {
      setCriandoPedido(false);
    }
  }

  const tituloEtapaAtual: Record<EtapaNovoPedidoWizard, string> = {
    caso_contexto: "Caso e contexto",
    objetivo_juridico: "Objetivo jurídico",
    estrategia_inicial: "Estratégia inicial",
    documentos_provas: "Documentos e provas",
    revisao_criacao: "Revisão e criação",
  };

  return (
    <div className="space-y-6">
      <WizardStepper etapaAtual={etapaAtual} onSelecionarEtapa={setEtapaAtual} />

      {resultadoCriacao ? (
        <Card title="Pedido criado com sucesso" subtitle="O wizard concluiu a abertura do pedido com confirmação humana registrada.">
          <div className="space-y-4">
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-4">
              <p className="text-sm font-semibold text-[var(--color-ink)]">{resultadoCriacao.pedidoId}</p>
              <p className="mt-1 text-sm text-[var(--color-muted)]">{resultadoCriacao.titulo}</p>
              <p className="mt-3 text-sm text-[var(--color-muted)]">
                Upload concluído para {resultadoCriacao.uploadEfetuado} arquivo(s).
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href={`/peticoes/pedidos/${resultadoCriacao.pedidoId}`}
                className="rounded-xl bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-white"
              >
                Abrir pedido
              </Link>
              <Link
                href={`/peticoes/pipeline/${resultadoCriacao.pedidoId}`}
                className="rounded-xl border border-[var(--color-border)] px-4 py-2 text-sm font-semibold text-[var(--color-ink)]"
              >
                Ir para o pipeline
              </Link>
            </div>
          </div>
        </Card>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.5fr,0.9fr]">
        <Card title={tituloEtapaAtual[etapaAtual]} subtitle="Fluxo guiado, com inferência assistida e confirmação humana antes da abertura final.">
          {etapaAtual === "caso_contexto" ? (
            <CasoContextoStep
              casos={casos}
              briefing={draftAtual.briefing}
              onSelecionarCaso={atualizarCasoSelecionado}
              onAtualizarBriefing={atualizarBriefing}
            />
          ) : null}

          {etapaAtual === "objetivo_juridico" ? (
            <ObjetivoJuridicoStep
              objetivo={draftAtual.objetivo}
              sugestoes={sugestoesObjetivo}
              onSelecionarCategoria={selecionarCategoria}
              onSelecionarObjetivo={selecionarObjetivo}
              onAtualizarIntencaoLivre={atualizarIntencaoLivre}
            />
          ) : null}

          {etapaAtual === "estrategia_inicial" ? (
            <EstrategiaInicialStep
              estrategia={draftAtual.estrategia}
              tiposPeca={tiposPeca}
              triagem={sugestaoTriagem}
              carregandoTriagem={carregandoTriagem}
              erroTriagem={erroTriagem}
              onAtualizarTriagem={atualizarSugestoesTriagem}
              onConfirmarTipoPeca={confirmarTipoPeca}
              onConfirmarPrioridade={confirmarPrioridade}
            />
          ) : null}

          {etapaAtual === "documentos_provas" ? (
            <DocumentosProvasStep
              documentos={draftAtual.documentos}
              pendencias={draftAtual.pendencias}
              tipoDocumentoUpload={tipoDocumentoUpload}
              onSelecionarArquivos={atualizarArquivos}
              onRemoverDocumento={removerArquivo}
              onAlterarTipoDocumentoUpload={setTipoDocumentoUpload}
            />
          ) : null}

          {etapaAtual === "revisao_criacao" ? (
            <RevisaoCriacaoStep
              revisao={draftAtual.revisao}
              pendencias={draftAtual.pendencias}
              confirmacao={draftAtual.confirmacao}
              criando={criandoPedido}
              erroCriacao={erroCriacao}
              onAlternarConfirmacao={alternarConfirmacao}
              onAtualizarObservacoes={atualizarObservacoesFinais}
              onCriarPedido={criarPedidoFinal}
            />
          ) : null}

          {errosEtapa.length > 0 ? (
            <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-4">
              <p className="text-sm font-semibold text-rose-700">Ainda não dá para avançar</p>
              <ul className="mt-2 space-y-1 text-sm text-rose-700">
                {errosEtapa.map((erro) => (
                  <li key={erro}>• {erro}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={voltarEtapa}
              disabled={etapaAtual === "caso_contexto"}
              className="rounded-xl border border-[var(--color-border)] px-4 py-2 text-sm font-semibold text-[var(--color-ink)] disabled:opacity-50"
            >
              Voltar
            </button>
            {etapaAtual !== "revisao_criacao" ? (
              <button
                type="button"
                onClick={avancarEtapa}
                className="rounded-xl bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-white"
              >
                Avançar
              </button>
            ) : null}
          </div>
        </Card>

        <div className="space-y-6">
          <Card title="Leitura do wizard" subtitle="Diferença clara entre sugestão, confirmação e lacuna.">
            <div className="space-y-4">
              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">Inferido</p>
                <p className="mt-2 text-sm text-[var(--color-ink)]">
                  {draftAtual.revisao.inferido.length} item(ns) montados automaticamente a partir do caso, prazo e briefing.
                </p>
              </div>
              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">Confirmado</p>
                <p className="mt-2 text-sm text-[var(--color-ink)]">
                  {draftAtual.revisao.confirmado.length} item(ns) já confirmados pelo usuário no wizard.
                </p>
              </div>
              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">Faltando</p>
                <p className="mt-2 text-sm text-[var(--color-ink)]">
                  {draftAtual.revisao.faltando.length} ponto(s) ainda dependem de preenchimento ou validação humana.
                </p>
              </div>
            </div>
          </Card>

          <Card title="Pendências em aberto" subtitle="O wizard sinaliza o que ainda não está suficientemente claro.">
            {draftAtual.pendencias.length > 0 ? (
              <div className="space-y-3">
                {draftAtual.pendencias.slice(0, 4).map((pendencia) => (
                  <div key={pendencia.codigo} className="rounded-2xl border border-[var(--color-border)] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-[var(--color-ink)]">{pendencia.titulo}</p>
                      <StatusBadge label={pendencia.severidade} variant={pendencia.severidade === "alta" ? "alerta" : "neutro"} />
                    </div>
                    <p className="mt-2 text-sm text-[var(--color-muted)]">{pendencia.descricao}</p>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                title="Sem pendências críticas"
                message="O briefing já tem densidade suficiente para seguir para criação controlada do pedido."
              />
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
