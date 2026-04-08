import type { EtapaPipeline, HistoricoPipeline, SnapshotPipelineEtapa } from "@/modules/peticoes/domain/types";
import { ETAPAS_IMPLEMENTADAS_PIPELINE, ETAPAS_MOCK_CONTROLADO } from "./pipeline-constants";

export function toHistoricoSnapshot(snapshot: SnapshotPipelineEtapa): HistoricoPipeline {
  const descricaoBase: Record<SnapshotPipelineEtapa["status"], string> = {
    concluido: "Snapshot persistido com sucesso.",
    em_andamento: "Etapa em processamento.",
    erro: "Etapa concluída com erro registrado.",
    mock_controlado: "Etapa não implementada nesta fase.",
    pendente: "Etapa aguardando execução.",
  };

  return {
    id: `HIST-${snapshot.id}`,
    etapa: snapshot.etapa,
    descricao: `${snapshot.etapa.replaceAll("_", " ")}: ${descricaoBase[snapshot.status]}`,
    data: snapshot.executadoEm,
    responsavel: "Sistema",
  };
}

export function toEtapaAtual(snapshots: SnapshotPipelineEtapa[]): EtapaPipeline {
  const ultimos = new Map<EtapaPipeline, SnapshotPipelineEtapa>();
  for (const snapshot of snapshots) {
    if (!ultimos.has(snapshot.etapa)) {
      ultimos.set(snapshot.etapa, snapshot);
    }
  }

  for (const etapa of ETAPAS_IMPLEMENTADAS_PIPELINE) {
    const snapshot = ultimos.get(etapa);
    if (!snapshot || snapshot.status !== "concluido") {
      return etapa;
    }
  }

  const aprovacao = ultimos.get("aprovacao");
  if (!aprovacao || aprovacao.status !== "concluido") {
    return "aprovacao";
  }

  return "aprovacao";
}

export function serializar(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value !== "object") {
    return String(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => serializar(item)).join(",")}]`;
  }

  const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b));
  return `{${entries.map(([key, item]) => `${key}:${serializar(item)}`).join(",")}}`;
}

function mudouSnapshot(input: {
  ultimo: SnapshotPipelineEtapa | null;
  entradaRef: Record<string, unknown>;
  saidaEstruturada: Record<string, unknown>;
  status: SnapshotPipelineEtapa["status"];
  codigoErro?: string;
  mensagemErro?: string;
}): boolean {
  if (!input.ultimo) {
    return true;
  }

  return !(
    serializar(input.ultimo.entradaRef) === serializar(input.entradaRef) &&
    serializar(input.ultimo.saidaEstruturada) === serializar(input.saidaEstruturada) &&
    input.ultimo.status === input.status &&
    (input.ultimo.codigoErro ?? "") === (input.codigoErro ?? "") &&
    (input.ultimo.mensagemErro ?? "") === (input.mensagemErro ?? "")
  );
}

export async function salvarSnapshotSeMudou(input: {
  pedidoId: string;
  etapa: EtapaPipeline;
  entradaRef: Record<string, unknown>;
  saidaEstruturada: Record<string, unknown>;
  status: SnapshotPipelineEtapa["status"];
  codigoErro?: string;
  mensagemErro?: string;
}): Promise<SnapshotPipelineEtapa> {
  const { getPeticoesOperacionalInfra } = await import(
    "@/modules/peticoes/infrastructure/operacional/provider.server"
  );
  const infra = getPeticoesOperacionalInfra();
  const ultimo = await infra.pipelineSnapshotRepository.obterUltimoPorEtapa(input.pedidoId, input.etapa);

  if (
    ultimo &&
    !mudouSnapshot({
      ultimo,
      entradaRef: input.entradaRef,
      saidaEstruturada: input.saidaEstruturada,
      status: input.status,
      codigoErro: input.codigoErro,
      mensagemErro: input.mensagemErro,
    })
  ) {
    return ultimo;
  }

  return infra.pipelineSnapshotRepository.salvarNovaVersao({
    pedidoId: input.pedidoId,
    etapa: input.etapa,
    entradaRef: input.entradaRef,
    saidaEstruturada: input.saidaEstruturada,
    status: input.status,
    codigoErro: input.codigoErro,
    mensagemErro: input.mensagemErro,
    tentativa: (ultimo?.tentativa ?? 0) + 1,
  });
}

export async function garantirSnapshotsMockControlado(pedidoId: string): Promise<void> {
  for (const etapa of ETAPAS_MOCK_CONTROLADO) {
    await salvarSnapshotSeMudou({
      pedidoId,
      etapa,
      entradaRef: { origem: "mock_controlado" },
      saidaEstruturada: {
        observacao: "Etapa visível na UX, porém não implementada nesta fase operacional.",
      },
      status: "mock_controlado",
    });
  }
}
