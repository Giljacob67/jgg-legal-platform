import "server-only";

import { getSqlClient } from "@/lib/database/client";
import type {
  ArquivoFisicoRepository,
  DocumentoJuridicoRepository,
  DocumentoVinculoRepository,
  ProcessamentoEtapaRepository,
} from "@/modules/documentos/application/contracts";
import type {
  ArquivoFisico,
  DocumentoJuridico,
  DocumentoVinculo,
  EtapaProcessamentoDocumental,
  ExecucaoEtapaProcessamento,
  StatusDocumento,
  StatusExecucaoEtapa,
  StatusProcessamentoDocumental,
  TipoDocumento,
} from "@/modules/documentos/domain/types";
import { CryptoHashService } from "@/modules/documentos/infrastructure/hashService";
import { VercelBlobStorageGateway } from "@/modules/documentos/infrastructure/vercelBlobStorageGateway";

type ArquivoFisicoRow = {
  id: string;
  provider: "vercel_blob" | "mock";
  provider_key: string;
  url: string;
  nome_original: string;
  mime_type: string;
  extensao: string | null;
  tamanho_bytes: number;
  sha256: string | null;
  checksum_algoritmo: "sha256";
  criado_em: string;
};

type DocumentoJuridicoRow = {
  id: string;
  arquivo_fisico_id: string;
  titulo: string;
  tipo_documento: TipoDocumento;
  status_documento: StatusDocumento;
  status_processamento: StatusProcessamentoDocumental;
  resumo_juridico: string | null;
  texto_extraido: string | null;
  texto_normalizado: string | null;
  metadados: Record<string, unknown>;
  criado_em: string;
  atualizado_em: string;
};

type DocumentoVinculoRow = {
  id: string;
  documento_juridico_id: string;
  tipo_entidade: "caso" | "pedido_peca";
  entidade_id: string;
  papel: "principal" | "apoio";
  criado_em: string;
};

type ExecucaoEtapaRow = {
  id: string;
  documento_juridico_id: string;
  etapa: EtapaProcessamentoDocumental;
  status: StatusExecucaoEtapa;
  tentativa: number;
  codigo_erro: string | null;
  mensagem_erro: string | null;
  entrada_ref: Record<string, unknown>;
  saida: Record<string, unknown>;
  iniciado_em: string | null;
  finalizado_em: string | null;
  criado_em: string;
};

function mapArquivo(row: ArquivoFisicoRow): ArquivoFisico {
  return {
    id: row.id,
    provider: row.provider,
    providerKey: row.provider_key,
    url: row.url,
    nomeOriginal: row.nome_original,
    mimeType: row.mime_type,
    extensao: row.extensao ?? undefined,
    tamanhoBytes: Number(row.tamanho_bytes),
    sha256: row.sha256 ?? undefined,
    checksumAlgoritmo: row.checksum_algoritmo,
    criadoEm: row.criado_em,
  };
}

function mapDocumento(row: DocumentoJuridicoRow): DocumentoJuridico {
  return {
    id: row.id,
    arquivoFisicoId: row.arquivo_fisico_id,
    titulo: row.titulo,
    tipoDocumento: row.tipo_documento,
    statusDocumento: row.status_documento,
    statusProcessamento: row.status_processamento,
    resumoJuridico: row.resumo_juridico ?? undefined,
    textoExtraido: row.texto_extraido ?? undefined,
    textoNormalizado: row.texto_normalizado ?? undefined,
    metadados: row.metadados ?? {},
    criadoEm: row.criado_em,
    atualizadoEm: row.atualizado_em,
  };
}

function mapVinculo(row: DocumentoVinculoRow): DocumentoVinculo {
  return {
    id: row.id,
    documentoJuridicoId: row.documento_juridico_id,
    tipoEntidade: row.tipo_entidade,
    entidadeId: row.entidade_id,
    papel: row.papel,
    criadoEm: row.criado_em,
  };
}

function mapExecucao(row: ExecucaoEtapaRow): ExecucaoEtapaProcessamento {
  return {
    id: row.id,
    documentoJuridicoId: row.documento_juridico_id,
    etapa: row.etapa,
    status: row.status,
    tentativa: row.tentativa,
    codigoErro: row.codigo_erro ?? undefined,
    mensagemErro: row.mensagem_erro ?? undefined,
    entradaRef: row.entrada_ref ?? {},
    saida: row.saida ?? {},
    iniciadoEm: row.iniciado_em ?? undefined,
    finalizadoEm: row.finalizado_em ?? undefined,
    criadoEm: row.criado_em,
  };
}

class RealArquivoFisicoRepository implements ArquivoFisicoRepository {
  async criar(input: Omit<ArquivoFisico, "id" | "criadoEm">): Promise<ArquivoFisico> {
    const sql = getSqlClient();

    const [row] = await sql<ArquivoFisicoRow[]>`
      INSERT INTO arquivo_fisico (
        provider,
        provider_key,
        url,
        nome_original,
        mime_type,
        extensao,
        tamanho_bytes,
        sha256,
        checksum_algoritmo
      )
      VALUES (
        ${input.provider},
        ${input.providerKey},
        ${input.url},
        ${input.nomeOriginal},
        ${input.mimeType},
        ${input.extensao ?? null},
        ${input.tamanhoBytes},
        ${input.sha256 ?? null},
        ${input.checksumAlgoritmo}
      )
      RETURNING *
    `;

    return mapArquivo(row);
  }

  async obterPorId(id: string): Promise<ArquivoFisico | null> {
    const sql = getSqlClient();
    const [row] = await sql<ArquivoFisicoRow[]>`
      SELECT *
      FROM arquivo_fisico
      WHERE id = ${id}
    `;

    return row ? mapArquivo(row) : null;
  }
}

class RealDocumentoJuridicoRepository implements DocumentoJuridicoRepository {
  async criar(input: {
    arquivoFisicoId: string;
    titulo: string;
    tipoDocumento: TipoDocumento;
    statusDocumento: StatusDocumento;
    metadados?: Record<string, unknown>;
  }): Promise<DocumentoJuridico> {
    const sql = getSqlClient();

    const [row] = await sql<DocumentoJuridicoRow[]>`
      INSERT INTO documento_juridico (
        arquivo_fisico_id,
        titulo,
        tipo_documento,
        status_documento,
        status_processamento,
        metadados
      )
      VALUES (
        ${input.arquivoFisicoId},
        ${input.titulo},
        ${input.tipoDocumento},
        ${input.statusDocumento},
        ${"nao_iniciado"},
        ${JSON.stringify(input.metadados ?? {})}::jsonb
      )
      RETURNING *
    `;

    return mapDocumento(row);
  }

  async listar(filtro?: { casoId?: string; pedidoId?: string }): Promise<DocumentoJuridico[]> {
    const sql = getSqlClient();
    let rows: DocumentoJuridicoRow[] = [];

    if (filtro?.casoId && filtro?.pedidoId) {
      rows = await sql<DocumentoJuridicoRow[]>`
        SELECT d.*
        FROM documento_juridico d
        WHERE EXISTS (
          SELECT 1
          FROM documento_vinculo dv
          WHERE dv.documento_juridico_id = d.id
            AND dv.tipo_entidade = 'caso'
            AND dv.entidade_id = ${filtro.casoId}
        )
          AND EXISTS (
            SELECT 1
            FROM documento_vinculo dv
            WHERE dv.documento_juridico_id = d.id
              AND dv.tipo_entidade = 'pedido_peca'
              AND dv.entidade_id = ${filtro.pedidoId}
          )
        ORDER BY d.criado_em DESC
      `;
    } else if (filtro?.casoId) {
      rows = await sql<DocumentoJuridicoRow[]>`
        SELECT d.*
        FROM documento_juridico d
        WHERE EXISTS (
          SELECT 1
          FROM documento_vinculo dv
          WHERE dv.documento_juridico_id = d.id
            AND dv.tipo_entidade = 'caso'
            AND dv.entidade_id = ${filtro.casoId}
        )
        ORDER BY d.criado_em DESC
      `;
    } else if (filtro?.pedidoId) {
      rows = await sql<DocumentoJuridicoRow[]>`
        SELECT d.*
        FROM documento_juridico d
        WHERE EXISTS (
          SELECT 1
          FROM documento_vinculo dv
          WHERE dv.documento_juridico_id = d.id
            AND dv.tipo_entidade = 'pedido_peca'
            AND dv.entidade_id = ${filtro.pedidoId}
        )
        ORDER BY d.criado_em DESC
      `;
    } else {
      rows = await sql<DocumentoJuridicoRow[]>`
        SELECT d.*
        FROM documento_juridico d
        ORDER BY d.criado_em DESC
      `;
    }

    return rows.map(mapDocumento);
  }

  async obterPorId(id: string): Promise<DocumentoJuridico | null> {
    const sql = getSqlClient();
    const [row] = await sql<DocumentoJuridicoRow[]>`
      SELECT *
      FROM documento_juridico
      WHERE id = ${id}
    `;

    return row ? mapDocumento(row) : null;
  }

  async atualizarConteudoProcessado(
    id: string,
    input: {
      textoExtraido?: string;
      textoNormalizado?: string;
      resumoJuridico?: string;
      statusDocumento?: StatusDocumento;
    },
  ): Promise<DocumentoJuridico> {
    const sql = getSqlClient();

    const [row] = await sql<DocumentoJuridicoRow[]>`
      UPDATE documento_juridico
      SET texto_extraido = COALESCE(${input.textoExtraido ?? null}, texto_extraido),
          texto_normalizado = COALESCE(${input.textoNormalizado ?? null}, texto_normalizado),
          resumo_juridico = COALESCE(${input.resumoJuridico ?? null}, resumo_juridico),
          status_documento = COALESCE(${input.statusDocumento ?? null}, status_documento),
          atualizado_em = NOW()
      WHERE id = ${id}
      RETURNING *
    `;

    if (!row) {
      throw new Error("Documento não encontrado para atualização de conteúdo processado.");
    }

    return mapDocumento(row);
  }

  async atualizarStatusProcessamento(
    id: string,
    status: StatusProcessamentoDocumental,
  ): Promise<DocumentoJuridico> {
    const sql = getSqlClient();

    const [row] = await sql<DocumentoJuridicoRow[]>`
      UPDATE documento_juridico
      SET status_processamento = ${status},
          atualizado_em = NOW()
      WHERE id = ${id}
      RETURNING *
    `;

    if (!row) {
      throw new Error("Documento não encontrado para atualização de processamento.");
    }

    return mapDocumento(row);
  }
}

class RealDocumentoVinculoRepository implements DocumentoVinculoRepository {
  async vincular(input: {
    documentoJuridicoId: string;
    tipoEntidade: "caso" | "pedido_peca";
    entidadeId: string;
    papel?: "principal" | "apoio";
  }): Promise<DocumentoVinculo> {
    const sql = getSqlClient();

    const [row] = await sql<DocumentoVinculoRow[]>`
      INSERT INTO documento_vinculo (
        documento_juridico_id,
        tipo_entidade,
        entidade_id,
        papel
      )
      VALUES (
        ${input.documentoJuridicoId},
        ${input.tipoEntidade},
        ${input.entidadeId},
        ${input.papel ?? "principal"}
      )
      ON CONFLICT (documento_juridico_id, tipo_entidade, entidade_id)
      DO UPDATE SET papel = EXCLUDED.papel
      RETURNING *
    `;

    return mapVinculo(row);
  }

  async listarPorEntidade(input: {
    tipoEntidade: "caso" | "pedido_peca";
    entidadeId: string;
  }): Promise<DocumentoVinculo[]> {
    const sql = getSqlClient();
    const rows = await sql<DocumentoVinculoRow[]>`
      SELECT *
      FROM documento_vinculo
      WHERE tipo_entidade = ${input.tipoEntidade}
        AND entidade_id = ${input.entidadeId}
      ORDER BY criado_em DESC
    `;

    return rows.map(mapVinculo);
  }

  async listarPorDocumento(documentoJuridicoId: string): Promise<DocumentoVinculo[]> {
    const sql = getSqlClient();
    const rows = await sql<DocumentoVinculoRow[]>`
      SELECT *
      FROM documento_vinculo
      WHERE documento_juridico_id = ${documentoJuridicoId}
      ORDER BY criado_em DESC
    `;

    return rows.map(mapVinculo);
  }
}

class RealProcessamentoEtapaRepository implements ProcessamentoEtapaRepository {
  async iniciarTentativa(input: {
    documentoJuridicoId: string;
    etapa: EtapaProcessamentoDocumental;
    entradaRef?: Record<string, unknown>;
  }): Promise<ExecucaoEtapaProcessamento> {
    const sql = getSqlClient();

    const [{ tentativa }] = await sql<{ tentativa: number }[]>`
      SELECT COALESCE(MAX(tentativa), 0) + 1 AS tentativa
      FROM documento_processamento_etapa
      WHERE documento_juridico_id = ${input.documentoJuridicoId}
        AND etapa = ${input.etapa}
    `;

    const [row] = await sql<ExecucaoEtapaRow[]>`
      INSERT INTO documento_processamento_etapa (
        documento_juridico_id,
        etapa,
        status,
        tentativa,
        entrada_ref,
        iniciado_em
      )
      VALUES (
        ${input.documentoJuridicoId},
        ${input.etapa},
        ${"em_andamento"},
        ${tentativa},
        ${JSON.stringify(input.entradaRef ?? {})}::jsonb,
        NOW()
      )
      RETURNING *
    `;

    return mapExecucao(row);
  }

  async concluirTentativa(input: {
    execucaoId: string;
    status: StatusExecucaoEtapa;
    saida?: Record<string, unknown>;
    codigoErro?: string;
    mensagemErro?: string;
  }): Promise<ExecucaoEtapaProcessamento> {
    const sql = getSqlClient();

    const [row] = await sql<ExecucaoEtapaRow[]>`
      UPDATE documento_processamento_etapa
      SET status = ${input.status},
          saida = ${JSON.stringify(input.saida ?? {})}::jsonb,
          codigo_erro = ${input.codigoErro ?? null},
          mensagem_erro = ${input.mensagemErro ?? null},
          finalizado_em = NOW()
      WHERE id = ${input.execucaoId}
      RETURNING *
    `;

    if (!row) {
      throw new Error("Execução de processamento não encontrada.");
    }

    return mapExecucao(row);
  }

  async listarPorDocumento(documentoJuridicoId: string): Promise<ExecucaoEtapaProcessamento[]> {
    const sql = getSqlClient();
    const rows = await sql<ExecucaoEtapaRow[]>`
      SELECT *
      FROM documento_processamento_etapa
      WHERE documento_juridico_id = ${documentoJuridicoId}
      ORDER BY criado_em DESC
    `;

    return rows.map(mapExecucao);
  }
}

export function createRealDocumentosInfra() {
  return {
    fileStorageGateway: new VercelBlobStorageGateway(),
    fileHashService: new CryptoHashService(),
    arquivoFisicoRepository: new RealArquivoFisicoRepository(),
    documentoJuridicoRepository: new RealDocumentoJuridicoRepository(),
    documentoVinculoRepository: new RealDocumentoVinculoRepository(),
    processamentoEtapaRepository: new RealProcessamentoEtapaRepository(),
  };
}
