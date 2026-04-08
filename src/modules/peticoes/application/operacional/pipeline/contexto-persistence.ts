import type { DocumentoComArquivoEVinculos } from "@/modules/documentos/domain/types";
import type { ContextoJuridicoPedido, EtapaPipeline, SnapshotPipelineEtapa } from "@/modules/peticoes/domain/types";
import { getPeticoesOperacionalInfra } from "@/modules/peticoes/infrastructure/operacional/provider.server";
import { ETAPAS_IMPLEMENTADAS_PIPELINE } from "./pipeline-constants";
import { serializar } from "./snapshot-persistence";

function normalizarArrayString(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

export async function salvarContextoSeMudou(input: {
  pedidoId: string;
  snapshots: SnapshotPipelineEtapa[];
  documentos: DocumentoComArquivoEVinculos[];
}): Promise<ContextoJuridicoPedido | null> {
  const infra = getPeticoesOperacionalInfra();
  const latestByStage = new Map<EtapaPipeline, SnapshotPipelineEtapa>();

  for (const snapshot of input.snapshots) {
    if (!latestByStage.has(snapshot.etapa)) {
      latestByStage.set(snapshot.etapa, snapshot);
    }
  }

  const extracao = latestByStage.get("extracao_de_fatos")?.saidaEstruturada ?? {};
  const estrategia = latestByStage.get("estrategia_juridica")?.saidaEstruturada ?? {};

  const fatosBrutos = Array.isArray((extracao as Record<string, unknown>).fatosRelevantes)
    ? ((extracao as Record<string, unknown>).fatosRelevantes as unknown[])
    : [];

  const fatosRelevantes = normalizarArrayString(
    fatosBrutos.map((fato) => {
      if (typeof fato === "string") {
        return fato;
      }

      if (typeof fato === "object" && fato && "descricao" in fato) {
        return String((fato as { descricao: string }).descricao);
      }

      return "";
    }),
  );

  const cronologia =
    Array.isArray((extracao as Record<string, unknown>).cronologia) &&
    (extracao as Record<string, unknown>).cronologia
      ? ((extracao as Record<string, unknown>).cronologia as Array<{ data?: string; descricao?: string; documentoId?: string }>)
          .filter((item) => !!item.data || !!item.descricao)
          .map((item) => ({
            data: item.data ?? "sem data",
            descricao: item.descricao ?? "Evento identificado na extração.",
            documentoId: item.documentoId,
          }))
      : [];

  const pontosControvertidos = normalizarArrayString((extracao as Record<string, unknown>).pontosControvertidos);

  const documentosChave = input.documentos.slice(0, 6).map((item) => ({
    documentoId: item.documento.id,
    titulo: item.documento.titulo,
    tipoDocumento: item.documento.tipoDocumento,
  }));

  const referenciasDocumentais = input.documentos.slice(0, 10).map((item) => ({
    documentoId: item.documento.id,
    titulo: item.documento.titulo,
    tipoDocumento: item.documento.tipoDocumento,
    trecho: item.documento.resumoJuridico,
  }));

  const estrategiaSugerida =
    typeof estrategia.diretriz === "string" && estrategia.diretriz.trim()
      ? estrategia.diretriz
      : "Consolidar tese principal a partir dos fatos extraídos e validar pedidos com suporte documental.";

  const fontesSnapshot = [...latestByStage.values()]
    .filter((snapshot) => ETAPAS_IMPLEMENTADAS_PIPELINE.includes(snapshot.etapa))
    .map((snapshot) => ({ etapa: snapshot.etapa, versao: snapshot.versao }));

  const ultimo = await infra.contextoJuridicoPedidoRepository.obterUltimaVersao(input.pedidoId);
  const payload = {
    pedidoId: input.pedidoId,
    versaoContexto: (ultimo?.versaoContexto ?? 0) + 1,
    fatosRelevantes,
    cronologia,
    pontosControvertidos,
    documentosChave,
    referenciasDocumentais,
    estrategiaSugerida,
    fontesSnapshot,
  };

  if (
    ultimo &&
    serializar(ultimo.fatosRelevantes) === serializar(payload.fatosRelevantes) &&
    serializar(ultimo.cronologia) === serializar(payload.cronologia) &&
    serializar(ultimo.pontosControvertidos) === serializar(payload.pontosControvertidos) &&
    serializar(ultimo.documentosChave) === serializar(payload.documentosChave) &&
    serializar(ultimo.referenciasDocumentais) === serializar(payload.referenciasDocumentais) &&
    ultimo.estrategiaSugerida === payload.estrategiaSugerida &&
    serializar(ultimo.fontesSnapshot) === serializar(payload.fontesSnapshot)
  ) {
    return ultimo;
  }

  return infra.contextoJuridicoPedidoRepository.salvarNovaVersao(payload);
}
