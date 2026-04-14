"use client";

import { useMemo, useState, useCallback } from "react";
import type {
  ContextoJuridicoPedido,
  EtapaPipeline,
  EtapaPipelineInfo,
  HistoricoPipeline,
  SnapshotPipelineEtapa,
} from "@/modules/peticoes/domain/types";
import { MAPA_ESTAGIO_PIPELINE, type EstagioExecutavel } from "@/modules/peticoes/domain/types";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatarDataHora } from "@/lib/utils";

type PipelineWorkspaceProps = {
  pedidoId: string;
  etapas: EtapaPipelineInfo[];
  etapaInicial: EtapaPipeline;
  historico: HistoricoPipeline[];
  snapshots: SnapshotPipelineEtapa[];
  contextoAtual: ContextoJuridicoPedido | null;
  /** Perfil do usuário atual, passado pelo layout autenticado. */
  perfilUsuario?: string;
};

type ResultadoAprovacao = "aprovado" | "rejeitado" | "revisao_pendente";

const PERFIS_QUE_APROVAM = ["coordenador_juridico", "socio_direcao", "administrador_sistema"];

// Estágios executáveis via IA (mapeados em MAPA_ESTAGIO_PIPELINE)
const ESTAGIOS_IA = Object.keys(MAPA_ESTAGIO_PIPELINE) as EstagioExecutavel[];
// Mapear EtapaPipeline → EstagioExecutavel para lookup
const PIPELINE_PARA_ESTAGIO = Object.fromEntries(
  Object.entries(MAPA_ESTAGIO_PIPELINE).map(([k, v]) => [v, k as EstagioExecutavel]),
) as Partial<Record<EtapaPipeline, EstagioExecutavel>>;

function toStatus(
  etapa: EtapaPipelineInfo,
  snapshot: SnapshotPipelineEtapa | undefined,
  etapaAtual: EtapaPipeline,
): { label: string; variant: "sucesso" | "alerta" | "neutro" | "implantacao" } {
  if (snapshot) {
    if (snapshot.status === "concluido") {
      return { label: "concluída", variant: "sucesso" };
    }

    if (snapshot.status === "erro") {
      return { label: "erro", variant: "alerta" };
    }

    if (snapshot.status === "em_andamento") {
      return { label: "em andamento", variant: "alerta" };
    }

    if (snapshot.status === "mock_controlado") {
      return { label: "mockado", variant: "implantacao" };
    }
  }

  if (etapa.id === etapaAtual) {
    return { label: "em andamento", variant: "alerta" };
  }

  if (!etapa.priorizadaMvp) {
    return { label: "mockado", variant: "implantacao" };
  }

  return { label: "pendente", variant: "neutro" };
}

export function PipelineWorkspace({
  pedidoId,
  etapas,
  etapaInicial,
  historico,
  snapshots,
  contextoAtual,
  perfilUsuario,
}: PipelineWorkspaceProps) {
  const [streamingEstagio, setStreamingEstagio] = useState<EstagioExecutavel | null>(null);
  const [streamTexts, setStreamTexts] = useState<Partial<Record<EstagioExecutavel, string>>>({});
  const [streamErrors, setStreamErrors] = useState<Partial<Record<EstagioExecutavel, string>>>({});
  const [aprovacaoObservacoes, setAprovacaoObservacoes] = useState("");
  const [aprovacaoStatus, setAprovacaoStatus] = useState<"idle" | "loading" | "sucesso" | "erro">("idle");
  const [aprovacaoMensagem, setAprovacaoMensagem] = useState<string | null>(null);

  const podeAprovar = perfilUsuario ? PERFIS_QUE_APROVAM.includes(perfilUsuario) : false;

  const executarEstagio = useCallback(async (estagio: EstagioExecutavel) => {
    setStreamingEstagio(estagio);
    setStreamErrors((prev) => ({ ...prev, [estagio]: undefined }));
    setStreamTexts((prev) => ({ ...prev, [estagio]: "" }));

    try {
      const res = await fetch(`/api/peticoes/pipeline/${pedidoId}/executar/${estagio}`, {
        method: "POST",
      });

      if (!res.ok) {
        const err = await res.json() as { error?: string };
        setStreamErrors((prev) => ({ ...prev, [estagio]: err.error ?? "Erro desconhecido" }));
        return;
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        setStreamTexts((prev) => ({
          ...prev,
          [estagio]: (prev[estagio] ?? "") + decoder.decode(value),
        }));
      }
    } catch (err) {
      setStreamErrors((prev) => ({
        ...prev,
        [estagio]: err instanceof Error ? err.message : "Erro desconhecido",
      }));
    } finally {
      setStreamingEstagio(null);
    }
  }, [pedidoId]);

  const enviarAprovacao = useCallback(async (resultado: ResultadoAprovacao) => {
    setAprovacaoStatus("loading");
    setAprovacaoMensagem(null);
    try {
      const res = await fetch(`/api/peticoes/pipeline/${pedidoId}/aprovacao`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resultado, observacoes: aprovacaoObservacoes || undefined }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) {
        setAprovacaoStatus("erro");
        setAprovacaoMensagem(data.error ?? "Erro ao registrar aprovação.");
      } else {
        setAprovacaoStatus("sucesso");
        setAprovacaoMensagem(
          resultado === "aprovado"
            ? "Minuta aprovada com sucesso."
            : resultado === "rejeitado"
              ? "Minuta rejeitada. Solicitar revisão ao responsável."
              : "Pendência de revisão registrada.",
        );
      }
    } catch (err) {
      setAprovacaoStatus("erro");
      setAprovacaoMensagem(err instanceof Error ? err.message : "Erro desconhecido.");
    }
  }, [pedidoId, aprovacaoObservacoes]);

  const snapshotsMap = useMemo(() => {
    const map = new Map<EtapaPipeline, SnapshotPipelineEtapa>();
    for (const snapshot of snapshots) {
      if (!map.has(snapshot.etapa)) {
        map.set(snapshot.etapa, snapshot);
      }
    }

    return map;
  }, [snapshots]);

  return (
    <div className="space-y-6">
      <Card title="Pipeline de produção" subtitle="10 etapas visuais, com operação funcional priorizada em 6 etapas do MVP.">
        <div className="mb-4 flex flex-wrap gap-2">
          <button
            disabled
            className="rounded-xl border border-[var(--color-border)] px-3 py-1.5 text-sm font-medium text-[var(--color-ink)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Etapas sincronizadas por snapshot
          </button>
          <button
            disabled
            className="rounded-xl bg-[var(--color-accent)] px-3 py-1.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            Etapa atual: {etapaInicial.replaceAll("_", " ")}
          </button>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {etapas.map((etapa, index) => {
            const snapshot = snapshotsMap.get(etapa.id);
            const status = toStatus(etapa, snapshot, etapaInicial);
            return (
              <article key={etapa.id} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-[var(--color-ink)]">
                    {index + 1}. {etapa.nome}
                  </p>
                  <StatusBadge label={status.label} variant={status.variant} />
                </div>
                <p className="mt-2 text-xs text-[var(--color-muted)]">
                  {etapa.priorizadaMvp
                    ? "Etapa funcional nesta versão do MVP."
                    : "Etapa visível e tipada para evolução posterior."}
                </p>
                {snapshot ? (
                  <p className="mt-1 text-xs text-[var(--color-muted)]">
                    Versão {snapshot.versao} • tentativa {snapshot.tentativa}
                  </p>
                ) : null}
                {PIPELINE_PARA_ESTAGIO[etapa.id] !== undefined && (
                  <div className="mt-3 space-y-2">
                    <button
                      onClick={() => executarEstagio(PIPELINE_PARA_ESTAGIO[etapa.id]!)}
                      disabled={streamingEstagio !== null}
                      className="rounded-lg bg-[var(--color-accent)] px-3 py-1.5 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {streamingEstagio === PIPELINE_PARA_ESTAGIO[etapa.id] ? "Gerando..." : "Executar com IA"}
                    </button>
                    {streamErrors[PIPELINE_PARA_ESTAGIO[etapa.id]!] && (
                      <p className="text-xs text-red-600">
                        {streamErrors[PIPELINE_PARA_ESTAGIO[etapa.id]!]}
                      </p>
                    )}
                    {streamTexts[PIPELINE_PARA_ESTAGIO[etapa.id]!] && (
                      <pre className="max-h-48 overflow-y-auto whitespace-pre-wrap rounded-lg bg-gray-50 p-2 text-xs text-[var(--color-ink)]">
                        {streamTexts[PIPELINE_PARA_ESTAGIO[etapa.id]!]}
                      </pre>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </Card>

      <Card title="Histórico e auditoria" subtitle="Rastros mockados por etapa já executada.">
        <div className="space-y-3">
          {historico.map((item) => (
            <article key={item.id} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold text-[var(--color-ink)]">{item.descricao}</p>
                <p className="text-xs text-[var(--color-muted)]">{formatarDataHora(item.data)}</p>
              </div>
              <p className="mt-1 text-xs text-[var(--color-muted)]">Etapa: {item.etapa.replaceAll("_", " ")}</p>
              <p className="text-xs text-[var(--color-muted)]">Responsável: {item.responsavel}</p>
            </article>
          ))}
        </div>
      </Card>

      <Card title="Contexto jurídico consolidado" subtitle="Consolidação versionada de fatos, cronologia e estratégia.">
        {!contextoAtual ? (
          <p className="text-sm text-[var(--color-muted)]">Contexto ainda não consolidado para este pedido.</p>
        ) : (
          <div className="space-y-3 text-sm text-[var(--color-ink)]">
            <p className="text-xs text-[var(--color-muted)]">
              Versão {contextoAtual.versaoContexto} • {formatarDataHora(contextoAtual.criadoEm)}
            </p>
            <p>
              <strong>Estratégia sugerida:</strong> {contextoAtual.estrategiaSugerida}
            </p>
            <p>
              <strong>Fatos relevantes:</strong> {contextoAtual.fatosRelevantes.length}
            </p>
            <p>
              <strong>Pontos controvertidos:</strong> {contextoAtual.pontosControvertidos.length}
            </p>
            <p>
              <strong>Referências documentais:</strong> {contextoAtual.referenciasDocumentais.length}
            </p>
          </div>
        )}
      </Card>

      <Card
        title="Aprovação da minuta"
        subtitle={
          podeAprovar
            ? "Registre a decisão formal de aprovação, rejeição ou solicitação de revisão."
            : "Somente coordenadores, sócios e administradores podem aprovar minutas."
        }
      >
        {!podeAprovar ? (
          <p className="text-sm text-[var(--color-muted)]">
            Seu perfil não possui permissão para aprovar minutas neste pedido.
          </p>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--color-ink)]">
                Observações (opcional)
              </label>
              <textarea
                value={aprovacaoObservacoes}
                onChange={(e) => setAprovacaoObservacoes(e.target.value)}
                disabled={aprovacaoStatus === "loading"}
                rows={3}
                placeholder="Registre comentários, ressalvas ou instruções de revisão..."
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-3 py-2 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-muted)] disabled:opacity-50"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => enviarAprovacao("aprovado")}
                disabled={aprovacaoStatus === "loading"}
                className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {aprovacaoStatus === "loading" ? "Registrando..." : "Aprovar"}
              </button>
              <button
                onClick={() => enviarAprovacao("revisao_pendente")}
                disabled={aprovacaoStatus === "loading"}
                className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-4 py-2 text-sm font-semibold text-[var(--color-ink)] hover:bg-[var(--color-border)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Solicitar revisão
              </button>
              <button
                onClick={() => enviarAprovacao("rejeitado")}
                disabled={aprovacaoStatus === "loading"}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Rejeitar
              </button>
            </div>
            {aprovacaoMensagem && (
              <p
                className={`text-sm font-medium ${
                  aprovacaoStatus === "sucesso" ? "text-green-700" : "text-red-600"
                }`}
              >
                {aprovacaoMensagem}
              </p>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
