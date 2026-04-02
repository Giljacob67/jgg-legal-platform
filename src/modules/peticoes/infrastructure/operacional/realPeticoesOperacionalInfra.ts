import "server-only";

import { getSqlClient } from "@/lib/database/client";
import type {
  ContextoJuridicoPedidoRepository,
  MinutaRastroContextoRepository,
  PipelineSnapshotRepository,
} from "@/modules/peticoes/application/operacional/contracts";
import type { ContextoJuridicoPedido, EtapaPipeline, SnapshotPipelineEtapa } from "@/modules/peticoes/domain/types";

type SnapshotRow = {
  id: string;
  pedido_id: string;
  etapa: EtapaPipeline;
  versao: number;
  entrada_ref: Record<string, unknown>;
  saida_estruturada: Record<string, unknown>;
  status: SnapshotPipelineEtapa["status"];
  executado_em: string | null;
  codigo_erro: string | null;
  mensagem_erro: string | null;
  tentativa: number;
};

type ContextoRow = {
  id: string;
  pedido_id: string;
  versao_contexto: number;
  fatos_relevantes: string[];
  cronologia: Array<{ data: string; descricao: string; documentoId?: string }>;
  pontos_controvertidos: string[];
  documentos_chave: Array<{ documentoId: string; titulo: string; tipoDocumento: string }>;
  referencias_documentais: Array<{ documentoId: string; titulo: string; tipoDocumento: string; trecho?: string }>;
  estrategia_sugerida: string;
  fontes_snapshot: Array<{ etapa: EtapaPipeline; versao: number }>;
  criado_em: string;
};

type RastroRow = {
  versao_id: string;
  contexto_versao: number;
};

function mapSnapshot(row: SnapshotRow): SnapshotPipelineEtapa {
  return {
    id: row.id,
    pedidoId: row.pedido_id,
    etapa: row.etapa,
    versao: row.versao,
    entradaRef: row.entrada_ref ?? {},
    saidaEstruturada: row.saida_estruturada ?? {},
    status: row.status,
    executadoEm: row.executado_em ?? new Date().toISOString(),
    codigoErro: row.codigo_erro ?? undefined,
    mensagemErro: row.mensagem_erro ?? undefined,
    tentativa: row.tentativa,
  };
}

function mapContexto(row: ContextoRow): ContextoJuridicoPedido {
  return {
    id: row.id,
    pedidoId: row.pedido_id,
    versaoContexto: row.versao_contexto,
    fatosRelevantes: row.fatos_relevantes ?? [],
    cronologia: row.cronologia ?? [],
    pontosControvertidos: row.pontos_controvertidos ?? [],
    documentosChave: row.documentos_chave ?? [],
    referenciasDocumentais: row.referencias_documentais ?? [],
    estrategiaSugerida: row.estrategia_sugerida,
    fontesSnapshot: row.fontes_snapshot ?? [],
    criadoEm: row.criado_em,
  };
}

class RealPipelineSnapshotRepository implements PipelineSnapshotRepository {
  async listarPorPedido(pedidoId: string): Promise<SnapshotPipelineEtapa[]> {
    const sql = getSqlClient();
    const rows = await sql<SnapshotRow[]>`
      SELECT
        id,
        pedido_id,
        etapa,
        versao,
        entrada_ref,
        saida_estruturada,
        status,
        executado_em,
        codigo_erro,
        mensagem_erro,
        tentativa
      FROM pedido_pipeline_snapshot
      WHERE pedido_id = ${pedidoId}
      ORDER BY executado_em DESC, versao DESC
    `;

    return rows.map(mapSnapshot);
  }

  async obterUltimoPorEtapa(pedidoId: string, etapa: EtapaPipeline): Promise<SnapshotPipelineEtapa | null> {
    const sql = getSqlClient();
    const [row] = await sql<SnapshotRow[]>`
      SELECT
        id,
        pedido_id,
        etapa,
        versao,
        entrada_ref,
        saida_estruturada,
        status,
        executado_em,
        codigo_erro,
        mensagem_erro,
        tentativa
      FROM pedido_pipeline_snapshot
      WHERE pedido_id = ${pedidoId}
        AND etapa = ${etapa}
      ORDER BY versao DESC
      LIMIT 1
    `;

    return row ? mapSnapshot(row) : null;
  }

  async salvarNovaVersao(input: {
    pedidoId: string;
    etapa: EtapaPipeline;
    entradaRef: Record<string, unknown>;
    saidaEstruturada: Record<string, unknown>;
    status: SnapshotPipelineEtapa["status"];
    executadoEm?: string;
    codigoErro?: string;
    mensagemErro?: string;
    tentativa: number;
  }): Promise<SnapshotPipelineEtapa> {
    const sql = getSqlClient();
    const [maxVersion] = await sql<{ versao: number }[]>`
      SELECT COALESCE(MAX(versao), 0) + 1 AS versao
      FROM pedido_pipeline_snapshot
      WHERE pedido_id = ${input.pedidoId}
        AND etapa = ${input.etapa}
    `;

    const [row] = await sql<SnapshotRow[]>`
      INSERT INTO pedido_pipeline_snapshot (
        pedido_id,
        etapa,
        versao,
        entrada_ref,
        saida_estruturada,
        status,
        executado_em,
        codigo_erro,
        mensagem_erro,
        tentativa
      )
      VALUES (
        ${input.pedidoId},
        ${input.etapa},
        ${maxVersion.versao},
        ${JSON.stringify(input.entradaRef)}::jsonb,
        ${JSON.stringify(input.saidaEstruturada)}::jsonb,
        ${input.status},
        ${input.executadoEm ?? new Date().toISOString()},
        ${input.codigoErro ?? null},
        ${input.mensagemErro ?? null},
        ${input.tentativa}
      )
      RETURNING
        id,
        pedido_id,
        etapa,
        versao,
        entrada_ref,
        saida_estruturada,
        status,
        executado_em,
        codigo_erro,
        mensagem_erro,
        tentativa
    `;

    return mapSnapshot(row);
  }
}

class RealContextoJuridicoPedidoRepository implements ContextoJuridicoPedidoRepository {
  async listarVersoes(pedidoId: string): Promise<ContextoJuridicoPedido[]> {
    const sql = getSqlClient();
    const rows = await sql<ContextoRow[]>`
      SELECT *
      FROM pedido_contexto_juridico_versao
      WHERE pedido_id = ${pedidoId}
      ORDER BY versao_contexto DESC
    `;

    return rows.map(mapContexto);
  }

  async obterUltimaVersao(pedidoId: string): Promise<ContextoJuridicoPedido | null> {
    const sql = getSqlClient();
    const [row] = await sql<ContextoRow[]>`
      SELECT *
      FROM pedido_contexto_juridico_versao
      WHERE pedido_id = ${pedidoId}
      ORDER BY versao_contexto DESC
      LIMIT 1
    `;

    return row ? mapContexto(row) : null;
  }

  async salvarNovaVersao(input: Omit<ContextoJuridicoPedido, "id" | "criadoEm">): Promise<ContextoJuridicoPedido> {
    const sql = getSqlClient();

    const [row] = await sql<ContextoRow[]>`
      INSERT INTO pedido_contexto_juridico_versao (
        pedido_id,
        versao_contexto,
        fatos_relevantes,
        cronologia,
        pontos_controvertidos,
        documentos_chave,
        referencias_documentais,
        estrategia_sugerida,
        fontes_snapshot
      )
      VALUES (
        ${input.pedidoId},
        ${input.versaoContexto},
        ${JSON.stringify(input.fatosRelevantes)}::jsonb,
        ${JSON.stringify(input.cronologia)}::jsonb,
        ${JSON.stringify(input.pontosControvertidos)}::jsonb,
        ${JSON.stringify(input.documentosChave)}::jsonb,
        ${JSON.stringify(input.referenciasDocumentais)}::jsonb,
        ${input.estrategiaSugerida},
        ${JSON.stringify(input.fontesSnapshot)}::jsonb
      )
      RETURNING *
    `;

    return mapContexto(row);
  }
}

class RealMinutaRastroContextoRepository implements MinutaRastroContextoRepository {
  async upsertVinculo(input: {
    minutaId: string;
    versaoId: string;
    pedidoId: string;
    numeroVersao: number;
    contextoVersao: number;
  }): Promise<void> {
    const sql = getSqlClient();
    await sql`
      INSERT INTO minuta_versao_contexto (
        minuta_id,
        versao_id,
        pedido_id,
        numero_versao,
        contexto_versao
      )
      VALUES (
        ${input.minutaId},
        ${input.versaoId},
        ${input.pedidoId},
        ${input.numeroVersao},
        ${input.contextoVersao}
      )
      ON CONFLICT (versao_id)
      DO UPDATE
      SET minuta_id = EXCLUDED.minuta_id,
          pedido_id = EXCLUDED.pedido_id,
          numero_versao = EXCLUDED.numero_versao,
          contexto_versao = EXCLUDED.contexto_versao
    `;
  }

  async listarPorMinuta(minutaId: string): Promise<Array<{ versaoId: string; contextoVersao: number }>> {
    const sql = getSqlClient();
    const rows = await sql<RastroRow[]>`
      SELECT versao_id, contexto_versao
      FROM minuta_versao_contexto
      WHERE minuta_id = ${minutaId}
    `;

    return rows.map((row) => ({
      versaoId: row.versao_id,
      contextoVersao: row.contexto_versao,
    }));
  }
}

export function createRealPeticoesOperacionalInfra() {
  return {
    pipelineSnapshotRepository: new RealPipelineSnapshotRepository(),
    contextoJuridicoPedidoRepository: new RealContextoJuridicoPedidoRepository(),
    minutaRastroContextoRepository: new RealMinutaRastroContextoRepository(),
  };
}
