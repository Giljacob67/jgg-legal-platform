import Link from "next/link";
import { notFound } from "next/navigation";
import { ButtonLink } from "@/components/ui/button-link";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { FileIcon, ScaleIcon } from "@/components/ui/icons";
import { obterPedidoDePeca } from "@/modules/peticoes/application/obterPedidoDePeca";
import { obterMinutaPorPedidoId } from "@/modules/peticoes/application/obterMinutaPorPedidoId";
import { obterPipelineDoPedido } from "@/modules/peticoes/application/obterPipelineDoPedido";
import {
  avaliarSlaDaEtapa,
  calcularDiasRestantesPrazo,
  gerarAlertasGovernancaPedido,
  responsavelObrigatorioAtendido,
} from "@/modules/peticoes/application/governanca-pedido";
import { listarDocumentosPorPedido } from "@/modules/documentos/application/listarDocumentosPorPedido";
import { listarDocumentosPorCaso } from "@/modules/documentos/application/listarDocumentosPorCaso";
import { DocumentoUploadPanel } from "@/modules/documentos/ui/documento-upload-panel";
import { AtribuirResponsavelCard } from "@/modules/peticoes/ui/atribuir-responsavel-card";
import { MapaTesesPanel } from "@/modules/peticoes/ui/mapa-teses-panel";
import { PedidoWorkspaceOverview } from "@/modules/peticoes/ui/pedido-workspace-overview";
import { getDataMode } from "@/lib/data-mode";
import { formatarData, formatarDataHora } from "@/lib/utils";
import type { EtapaPipeline, SnapshotPipelineEtapa, StatusPedido } from "@/modules/peticoes/domain/types";

type PedidoDetalhePageProps = {
  params: Promise<{ pedidoId: string }>;
};

const STATUS_PEDIDO_VARIANT: Record<StatusPedido, "ativo" | "implantacao" | "planejado" | "sucesso" | "alerta" | "neutro"> = {
  "em triagem": "neutro",
  "em produção": "implantacao",
  "em revisão": "alerta",
  aprovado: "sucesso",
};

const PROXIMOS_PASSOS_POR_ETAPA: Record<EtapaPipeline, string[]> = {
  classificacao: [
    "Confirmar objetivo processual e tipo de peça.",
    "Definir responsável titular para saída da triagem.",
  ],
  leitura_documental: [
    "Conferir cobertura documental mínima para a tese.",
    "Identificar lacunas que exigem diligência com cliente.",
  ],
  extracao_de_fatos: [
    "Validar fatos críticos e cronologia com o responsável.",
    "Registrar inconsistências antes da estratégia jurídica.",
  ],
  analise_adversa: [
    "Mapear vulnerabilidades do argumento da parte contrária.",
    "Definir contranarrativa técnica para redação.",
  ],
  analise_documental_do_cliente: [
    "Cruzar documentos do cliente com fatos controvertidos.",
    "Anotar provas faltantes para eventual emenda.",
  ],
  estrategia_juridica: [
    "Fechar tese principal e tese subsidiária.",
    "Definir pedidos e fundamentos prioritários.",
  ],
  pesquisa_de_apoio: [
    "Consolidar precedentes e doutrina de apoio.",
    "Selecionar citações para fortalecer argumentação.",
  ],
  redacao: [
    "Produzir minuta base com estrutura completa.",
    "Garantir aderência entre fatos, fundamentos e pedidos.",
  ],
  revisao: [
    "Revisar coerência jurídica e linguagem técnica.",
    "Conferir referências documentais citadas na minuta.",
  ],
  aprovacao: [
    "Registrar decisão final de aprovação.",
    "Preparar protocolo e fechamento do ciclo do pedido.",
  ],
};

function consolidarUltimoSnapshotPorEtapa(snapshots: SnapshotPipelineEtapa[]) {
  const mapa = new Map<EtapaPipeline, SnapshotPipelineEtapa>();
  for (const snapshot of snapshots) {
    if (!mapa.has(snapshot.etapa)) {
      mapa.set(snapshot.etapa, snapshot);
    }
  }
  return mapa;
}

export default async function PedidoDetalhePage({ params }: PedidoDetalhePageProps) {
  const dataMode = getDataMode();
  const { pedidoId } = await params;
  const pedido = await obterPedidoDePeca(pedidoId);

  if (!pedido) {
    notFound();
  }

  const minuta = await obterMinutaPorPedidoId(pedidoId);
  const pipelineOperacional = await obterPipelineDoPedido(pedido.id).catch(() => null);
  const documentosDoPedido = await listarDocumentosPorPedido(pedido.id);
  const documentos = documentosDoPedido.length > 0 ? documentosDoPedido : await listarDocumentosPorCaso(pedido.casoId);

  const historico = (pipelineOperacional?.historico ?? []).slice().sort(
    (a, b) => new Date(b.data).getTime() - new Date(a.data).getTime(),
  );

  const snapshots = pipelineOperacional?.snapshots ?? [];
  const ultimoSnapshotPorEtapa = consolidarUltimoSnapshotPorEtapa(snapshots);
  const totalEtapas = pipelineOperacional?.etapas.length ?? 0;
  const etapasConcluidas = Array.from(ultimoSnapshotPorEtapa.values()).filter(
    (snapshot) => snapshot.status === "concluido",
  ).length;
  const percentualConclusao = totalEtapas > 0 ? Math.round((etapasConcluidas / totalEtapas) * 100) : 0;
  const diasRestantes = calcularDiasRestantesPrazo(pedido.prazoFinal);
  const etapaAtual = pipelineOperacional?.etapaAtual ?? pedido.etapaAtual;
  const slaEtapaAtual = avaliarSlaDaEtapa({
    etapa: etapaAtual,
    pedidoCriadoEm: pedido.criadoEm,
    snapshots,
  });
  const responsavelDefinido = responsavelObrigatorioAtendido(pedido.responsavel);

  const pendencias: Array<{ titulo: string; descricao: string; severidade: "alta" | "media" | "baixa" }> = [];
  const alertasGovernanca = gerarAlertasGovernancaPedido({
    prazoFinal: pedido.prazoFinal,
    etapaAtual,
    pedidoCriadoEm: pedido.criadoEm,
    responsavel: pedido.responsavel,
    snapshots,
  });

  for (const alerta of alertasGovernanca) {
    pendencias.push({
      titulo: alerta.titulo,
      descricao: alerta.descricao,
      severidade: alerta.severidade,
    });
  }

  if (documentos.length === 0) {
    pendencias.push({
      titulo: "Sem documentação vinculada",
      descricao: "Nenhum documento foi anexado ao pedido/caso para sustentar a produção da peça.",
      severidade: "media",
    });
  }

  if (!pipelineOperacional?.contextoAtual) {
    pendencias.push({
      titulo: "Contexto jurídico não consolidado",
      descricao: "Ainda não há consolidação estruturada de fatos, cronologia e pontos controvertidos.",
      severidade: "media",
    });
  } else if (pipelineOperacional.contextoAtual.validacaoHumanaTesesPendente) {
    pendencias.push({
      titulo: "Validação humana de teses pendente",
      descricao: "Aprovação final bloqueada até aprovar, ajustar ou rejeitar as teses inferidas e/ou registrar tese manual.",
      severidade: "alta",
    });
  }

  const snapshotsComErro = snapshots.filter((snapshot) => snapshot.status === "erro");
  if (snapshotsComErro.length > 0) {
    pendencias.push({
      titulo: "Erro em etapa do pipeline",
      descricao: `${snapshotsComErro.length} etapa(s) registraram erro técnico e precisam de reprocessamento.`,
      severidade: "alta",
    });
  }

  if (!minuta && etapaAtual !== "classificacao" && etapaAtual !== "leitura_documental") {
    pendencias.push({
      titulo: "Minuta ainda não disponível",
      descricao: "A peça ainda não chegou ao editor, apesar do avanço para etapas estratégicas.",
      severidade: "media",
    });
  }

  const proximosPassos = [
    ...PROXIMOS_PASSOS_POR_ETAPA[etapaAtual],
    ...pendencias.slice(0, 2).map((item) => item.descricao),
  ];
  const bloqueiosCriticos = pendencias.filter((item) => item.severidade === "alta").length;
  const hrefAcaoPrincipal = !responsavelDefinido
    ? "#responsavel"
    : !pipelineOperacional?.contextoAtual
      ? `/peticoes/pipeline/${pedido.id}`
      : pipelineOperacional.contextoAtual.validacaoHumanaTesesPendente
        ? "#mapa-teses"
        : minuta
          ? `/peticoes/minutas/${minuta.id}/editor`
          : `/peticoes/pipeline/${pedido.id}`;
  const labelAcaoPrincipal = !responsavelDefinido
    ? "Definir responsável"
    : !pipelineOperacional?.contextoAtual
      ? "Consolidar contexto"
      : pipelineOperacional.contextoAtual.validacaoHumanaTesesPendente
        ? "Validar teses"
        : minuta
          ? "Continuar no editor"
          : "Abrir produção";

  return (
    <div className="space-y-6">
      <PageHeader
        title={pedido.titulo}
        description={`Pedido ${pedido.id} vinculado ao caso ${pedido.casoId}`}
        meta={
          <>
            <StatusBadge label={pedido.status} variant={STATUS_PEDIDO_VARIANT[pedido.status]} />
            <StatusBadge label={`prioridade ${pedido.prioridade}`} variant={pedido.prioridade === "alta" ? "alerta" : "neutro"} />
            <StatusBadge label={`prazo ${formatarData(pedido.prazoFinal)}`} variant={diasRestantes <= 2 ? "alerta" : "neutro"} />
          </>
        }
        actions={
          <>
            <ButtonLink href={hrefAcaoPrincipal} label={labelAcaoPrincipal} icon={<ScaleIcon size={16} />} />
            <ButtonLink href={`/peticoes/pipeline/${pedido.id}`} label="Abrir pipeline" icon={<ScaleIcon size={16} />} variant="secundario" />
            {minuta ? (
              <ButtonLink href={`/peticoes/minutas/${minuta.id}/editor`} label="Abrir editor" icon={<FileIcon size={16} />} variant="secundario" />
            ) : null}
          </>
        }
      />

      <PedidoWorkspaceOverview
        pedidoId={pedido.id}
        pedidoStatus={pedido.status}
        etapaAtual={etapaAtual}
        responsavel={pedido.responsavel}
        responsavelDefinido={responsavelDefinido}
        totalDocumentos={documentos.length}
        percentualConclusao={percentualConclusao}
        pendenciasCriticas={bloqueiosCriticos}
        contextoAtual={pipelineOperacional?.contextoAtual ?? null}
        minutaId={minuta?.id}
      />

      <section id="controle" className="grid gap-4 scroll-mt-24 md:grid-cols-2 xl:grid-cols-4">
        <Card title="Etapa atual" eyebrow="Execução">
          <p className="font-serif text-3xl text-[var(--color-ink)]">{etapaAtual.replaceAll("_", " ")}</p>
          <p className="text-xs text-[var(--color-muted)]">Status geral do pedido: {pedido.status}</p>
        </Card>
        <Card title="Progresso do pipeline" eyebrow="Andamento">
          <p className="font-serif text-3xl text-[var(--color-ink)]">{percentualConclusao}%</p>
          <p className="text-xs text-[var(--color-muted)]">
            {etapasConcluidas} de {totalEtapas} etapas consolidadas.
          </p>
          <div className="mt-3 h-2 rounded-full bg-[var(--color-surface-alt)]">
            <div className="h-2 rounded-full bg-[var(--color-accent)]" style={{ width: `${percentualConclusao}%` }} />
          </div>
        </Card>
        <Card title="Responsável" eyebrow="Alocação">
          <p className="font-serif text-3xl text-[var(--color-ink)]">{pedido.responsavel || "Não definido"}</p>
          <p className="text-xs text-[var(--color-muted)]">
            {responsavelDefinido
              ? "Titular da condução do pedido nesta etapa."
              : "Definição pendente. Execução e aprovação ficam bloqueadas até atribuição."}
          </p>
        </Card>
        <Card title="Prazo final" eyebrow="SLA">
          <p className="font-serif text-3xl text-[var(--color-ink)]">{formatarData(pedido.prazoFinal)}</p>
          <p className="text-xs text-[var(--color-muted)]">
            {diasRestantes < 0
              ? `Vencido há ${Math.abs(diasRestantes)} dia(s).`
              : `${diasRestantes} dia(s) restante(s) para o prazo.`}
          </p>
          <p className="mt-2 text-xs text-[var(--color-muted)]">
            SLA da etapa atual: {slaEtapaAtual.diasConsumidos}/{slaEtapaAtual.diasSla} dia(s) •{" "}
            {slaEtapaAtual.status === "estourado"
              ? "estourado"
              : slaEtapaAtual.status === "atencao"
                ? "em atenção"
                : "dentro do limite"}
          </p>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.4fr,1fr]">
        <Card title="Resumo executivo" subtitle="Visão consolidada para decisão jurídica e priorização da execução." eyebrow="Situação">
          <div className="space-y-3 text-sm text-[var(--color-ink)]">
            <p>
              <strong>Tipo de peça:</strong> {pedido.tipoPeca}
            </p>
            <p>
              <strong>Prioridade:</strong> {pedido.prioridade}
            </p>
            <p>
              <strong>Documentos vinculados:</strong> {documentos.length}
            </p>
            <p>
              <strong>Minuta:</strong> {minuta ? `disponível (${minuta.id})` : "não disponível"}
            </p>
            <p>
              <strong>Contexto jurídico:</strong>{" "}
              {pipelineOperacional?.contextoAtual
                ? `v${pipelineOperacional.contextoAtual.versaoContexto}, atualizado em ${formatarDataHora(
                    pipelineOperacional.contextoAtual.criadoEm,
                  )}`
                : "não consolidado"}
            </p>
            {pipelineOperacional?.contextoAtual?.estrategiaSugerida ? (
              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-muted-strong)]">
                  Estratégia consolidada
                </p>
                <p className="mt-2 text-sm text-[var(--color-muted)]">
                  {pipelineOperacional.contextoAtual.estrategiaSugerida}
                </p>
              </div>
            ) : null}
          </div>
        </Card>

        <Card title="Pendências operacionais" subtitle="Itens que travam prazo, qualidade ou rastreabilidade." eyebrow="Ação">
          {pendencias.length === 0 ? (
            <p className="text-sm text-[var(--color-muted)]">Sem pendências críticas no momento.</p>
          ) : (
            <div className="space-y-3">
              {pendencias.map((item) => (
                <article key={item.titulo} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-[var(--color-ink)]">{item.titulo}</p>
                    <StatusBadge label={item.severidade} variant={item.severidade === "alta" ? "alerta" : "neutro"} />
                  </div>
                  <p className="mt-2 text-xs text-[var(--color-muted)]">{item.descricao}</p>
                </article>
              ))}
            </div>
          )}
        </Card>
      </section>

      {!responsavelDefinido ? (
        <div id="responsavel" className="scroll-mt-24">
          <AtribuirResponsavelCard pedidoId={pedido.id} responsavelAtual={pedido.responsavel} />
        </div>
      ) : null}

      <div id="mapa-teses" className="scroll-mt-24">
        <MapaTesesPanel pedidoId={pedido.id} contextoAtual={pipelineOperacional?.contextoAtual ?? null} />
      </div>

      <div id="timeline" className="scroll-mt-24">
        <Card title="Timeline do pedido" subtitle="Histórico cronológico de eventos operacionais e técnicos." eyebrow="Rastro">
          {historico.length === 0 ? (
            <p className="text-sm text-[var(--color-muted)]">Sem eventos registrados até o momento.</p>
          ) : (
            <div className="space-y-3">
              {historico.map((item) => (
                <article key={item.id} className="rounded-[1.2rem] border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-[var(--color-ink)]">{item.descricao}</p>
                    <p className="text-xs text-[var(--color-muted)]">{formatarDataHora(item.data)}</p>
                  </div>
                  <p className="mt-2 text-xs text-[var(--color-muted)]">
                    Etapa: {item.etapa.replaceAll("_", " ")} • Responsável: {item.responsavel}
                  </p>
                </article>
              ))}
            </div>
          )}
        </Card>
      </div>

      <DocumentoUploadPanel
        titulo="Adicionar documento ao pedido"
        descricao="Anexe novos documentos e vincule diretamente ao caso e ao pedido para alimentar contexto e redação."
        fixedVinculos={[
          { tipoEntidade: "caso", entidadeId: pedido.casoId, papel: "principal" },
          { tipoEntidade: "pedido_peca", entidadeId: pedido.id, papel: "apoio" },
        ]}
        mostrarSeletores={false}
        modoUpload={dataMode === "real" ? "cliente_blob" : "api"}
      />

      <section id="documentos" className="grid gap-6 scroll-mt-24 xl:grid-cols-[1.25fr,0.9fr]">
        <Card title="Documentos vinculados" subtitle="Material disponível para leitura, estratégia e redação da peça." eyebrow="Documentação">
          {documentos.length === 0 ? (
            <p className="text-sm text-[var(--color-muted)]">Nenhum documento vinculado ao pedido ou caso.</p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {documentos.map((documento) => (
                <article key={documento.id} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-3">
                  <p className="font-semibold text-[var(--color-ink)]">{documento.titulo}</p>
                  <p className="mt-1 text-xs text-[var(--color-muted)]">
                    {documento.tipo} • {documento.status}
                  </p>
                  <p className="mt-1 text-xs text-[var(--color-muted)]">
                    Processamento: {documento.statusProcessamento}
                  </p>
                </article>
              ))}
            </div>
          )}
        </Card>

        <Card title="Próximos passos" subtitle="Ações sugeridas para avançar o pedido sem perda de prazo ou qualidade." eyebrow="Plano">
          <div className="space-y-2">
            {proximosPassos.map((passo) => (
              <p key={passo} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-3 py-2 text-sm text-[var(--color-muted)]">
                {passo}
              </p>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href={`/peticoes/pipeline/${pedido.id}`} className="text-sm font-semibold text-[var(--color-accent)]">
              Ir para pipeline
            </Link>
            {minuta ? (
              <Link href={`/peticoes/minutas/${minuta.id}/editor`} className="text-sm font-semibold text-[var(--color-accent)]">
                Ir para editor
              </Link>
            ) : null}
          </div>
        </Card>
      </section>
    </div>
  );
}
