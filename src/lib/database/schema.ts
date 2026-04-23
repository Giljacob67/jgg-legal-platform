import "server-only";

import {
  pgTable,
  text,
  timestamp,
  varchar,
  uuid,
  integer,
  bigint,
  boolean,
  customType,
  jsonb,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// ─────────────────────────────────────────────────────────────
// CUSTOM TYPES
// ─────────────────────────────────────────────────────────────

/** pgvector(1536) — OpenAI text-embedding-3-small / ada-002 */
export const vector = customType<{ data: number[]; driverData: string }>({
  dataType() {
    return "vector(1536)";
  },
  toDriver(value: number[]): string {
    return JSON.stringify(value);
  },
  fromDriver(value: unknown): number[] {
    if (typeof value === "string") {
      try {
        return JSON.parse(value);
      } catch {
        return [];
      }
    }
    return value as number[];
  },
});

// ─────────────────────────────────────────────────────────────
// ENUMS (via PostgreSQL CREATE TYPE — ver migrations 0002, 0003)
// ─────────────────────────────────────────────────────────────

/** status_processamento_documental — migration 0002 */
export type StatusProcessamentoDocumental =
  | "nao_iniciado"
  | "enfileirado"
  | "em_processamento"
  | "processado_parcial"
  | "processado"
  | "erro";

/** etapa_processamento_documental — migration 0003 */
export type EtapaProcessamentoDocumental =
  | "leitura"
  | "classificacao"
  | "resumo"
  | "extracao_fatos";

/** status_execucao_etapa — migration 0003 */
export type StatusExecucaoEtapa =
  | "pendente"
  | "em_andamento"
  | "sucesso"
  | "falha"
  | "parcial";

// ─────────────────────────────────────────────────────────────
// ENUM TABLES (representados como pgTable com validação via CHECK)
// ─────────────────────────────────────────────────────────────

export const arquivoFisico = pgTable("arquivo_fisico", {
  id: uuid("id").primaryKey().defaultRandom(),
  provider: varchar("provider", { length: 50 }).notNull(), // 'vercel_blob' | 'mock'
  providerKey: varchar("provider_key", { length: 500 }).notNull().unique(),
  url: text("url").notNull(),
  nomeOriginal: varchar("nome_original", { length: 500 }).notNull(),
  mimeType: varchar("mime_type", { length: 100 }).notNull(),
  extensao: varchar("extensao", { length: 20 }),
  tamanhoBytes: integer("tamanho_bytes").notNull(), // BIGINT mapeado como number; usar bigInt() se precisar de Range
  sha256: text("sha256"),
  checksumAlgoritmo: varchar("checksum_algoritmo", { length: 20 }).notNull().default("sha256"),
  criadoEm: timestamp("criado_em").defaultNow().notNull(),
});

export const documentoJuridico = pgTable("documento_juridico", {
  id: uuid("id").primaryKey().defaultRandom(),
  arquivoFisicoId: uuid("arquivo_fisico_id")
    .notNull()
    .references(() => arquivoFisico.id, { onDelete: "cascade" }),
  titulo: text("titulo").notNull(),
  tipoDocumento: varchar("tipo_documento", { length: 100 }).notNull(),
  statusDocumento: varchar("status_documento", { length: 50 }).notNull(),
  statusProcessamento: varchar("status_processamento", { length: 50 })
    .notNull()
    .default("nao_iniciado"),
  resumoJuridico: text("resumo_juridico"),
  metadados: jsonb("metadados").notNull().default({}),
  textoExtraido: text("texto_extraido"),
  textoNormalizado: text("texto_normalizado"),
  criadoEm: timestamp("criado_em").defaultNow().notNull(),
  atualizadoEm: timestamp("atualizado_em").defaultNow().notNull(),
});

export const documentoVinculo = pgTable(
  "documento_vinculo",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    documentoJuridicoId: uuid("documento_juridico_id")
      .notNull()
      .references(() => documentoJuridico.id, { onDelete: "cascade" }),
    tipoEntidade: varchar("tipo_entidade", { length: 20 }).notNull(), // 'caso' | 'pedido_peca'
    entidadeId: text("entidade_id").notNull(),
    papel: varchar("papel", { length: 50 }).notNull().default("principal"),
    criadoEm: timestamp("criado_em").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("doc_vinculo_unique").on(
      table.documentoJuridicoId,
      table.tipoEntidade,
      table.entidadeId,
    ),
    index("idx_documento_vinculo_entidade").on(table.tipoEntidade, table.entidadeId),
  ],
);

export const documentoProcessamentoEtapa = pgTable(
  "documento_processamento_etapa",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    documentoJuridicoId: uuid("documento_juridico_id")
      .notNull()
      .references(() => documentoJuridico.id, { onDelete: "cascade" }),
    etapa: varchar("etapa", { length: 50 }).notNull(),
    status: varchar("status", { length: 20 }).notNull(),
    tentativa: integer("tentativa").notNull().default(1),
    codigoErro: text("codigo_erro"),
    mensagemErro: text("mensagem_erro"),
    entradaRef: jsonb("entrada_ref").notNull().default({}),
    saida: jsonb("saida").notNull().default({}),
    iniciadoEm: timestamp("iniciado_em"),
    finalizadoEm: timestamp("finalizado_em"),
    criadoEm: timestamp("criado_em").defaultNow().notNull(),
  },
  (table) => [
    index("idx_proc_etapa_doc_etapa").on(
      table.documentoJuridicoId,
      table.etapa,
      table.tentativa,
    ),
    index("idx_proc_etapa_status").on(table.status, table.criadoEm),
  ],
);

// ─────────────────────────────────────────────────────────────
// USERS E AUTHENTICATION
// ─────────────────────────────────────────────────────────────
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  initials: varchar("initials", { length: 10 }),
  role: varchar("role", { length: 100 }),
  perfil: varchar("perfil", { length: 50 }),
  ativo: boolean("ativo").notNull().default(true),
  ultimoAcesso: timestamp("ultimo_acesso"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─────────────────────────────────────────────────────────────
// CASOS JURÍDICOS E SEUS DETALHES
// ─────────────────────────────────────────────────────────────
export const casos = pgTable("casos", {
  id: varchar("id", { length: 50 }).primaryKey(),
  titulo: varchar("titulo", { length: 255 }).notNull(),
  cliente: varchar("cliente", { length: 255 }).notNull(),
  materia: varchar("materia", { length: 100 }).notNull(),
  tribunal: varchar("tribunal", { length: 100 }),
  status: varchar("status", { length: 50 }).notNull(),
  prazoFinal: timestamp("prazo_final"),
  resumo: text("resumo"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const partes = pgTable(
  "partes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    casoId: varchar("caso_id", { length: 50 }).references(() => casos.id, { onDelete: "cascade" }),
    nome: varchar("nome", { length: 255 }).notNull(),
    papel: varchar("papel", { length: 50 }).notNull(),
  },
  (table) => [index("idx_partes_caso_id").on(table.casoId)],
);

export const eventosCaso = pgTable(
  "eventos_caso",
  {
    id: varchar("id", { length: 50 }).primaryKey(),
    casoId: varchar("caso_id", { length: 50 }).references(() => casos.id, { onDelete: "cascade" }),
    data: timestamp("data").notNull(),
    descricao: text("descricao").notNull(),
  },
  (table) => [index("idx_eventos_caso_caso_id").on(table.casoId)],
);

// ─────────────────────────────────────────────────────────────
// PEÇAS, PIPELINE E DOCUMENTOS
// ─────────────────────────────────────────────────────────────
export const pedidosPeca = pgTable("pedidos_peca", {
  id: varchar("id", { length: 50 }).primaryKey(),
  casoId: varchar("caso_id", { length: 50 }).references(() => casos.id, { onDelete: "cascade" }),
  titulo: varchar("titulo", { length: 255 }).notNull(),
  tipoPeca: varchar("tipo_peca", { length: 150 }).notNull(),
  prioridade: varchar("prioridade", { length: 50 }).notNull(),
  status: varchar("status", { length: 50 }).notNull(),
  etapaAtual: varchar("etapa_atual", { length: 100 }).notNull(),
  responsavel: varchar("responsavel", { length: 255 }),
  prazoFinal: timestamp("prazo_final"),
  /** Objetivo processual do pedido — guia o agente de IA (ver IntencaoProcessual em domain/types.ts) */
  intencaoProcessual: varchar("intencao_processual", { length: 100 }),
  /** ID do documento jurídico que originou este pedido */
  documentoOrigemId: text("documento_origem_id"),
  criadoEm: timestamp("criado_em").defaultNow().notNull(),
});

export const historicoPipeline = pgTable("historico_pipeline", {
  id: varchar("id", { length: 50 }).primaryKey(),
  pedidoId: varchar("pedido_id", { length: 50 }).references(() => pedidosPeca.id, { onDelete: "cascade" }),
  etapa: varchar("etapa", { length: 100 }).notNull(),
  descricao: text("descricao").notNull(),
  data: timestamp("data").notNull(),
  responsavel: varchar("responsavel", { length: 255 }),
});

export const minutas = pgTable("minutas", {
  id: varchar("id", { length: 50 }).primaryKey(),
  pedidoId: varchar("pedido_id", { length: 50 }).references(() => pedidosPeca.id, { onDelete: "cascade" }),
  titulo: varchar("titulo", { length: 255 }).notNull(),
  conteudoAtual: text("conteudo_atual"),
});

export const versoesMinuta = pgTable(
  "versoes_minuta",
  {
    id: varchar("id", { length: 50 }).primaryKey(),
    minutaId: varchar("minuta_id", { length: 50 }).references(() => minutas.id, { onDelete: "cascade" }),
    numero: integer("numero").notNull(),
    criadoEm: timestamp("criado_em").defaultNow().notNull(),
    autor: varchar("autor", { length: 255 }).notNull(),
    resumoMudancas: text("resumo_mudancas"),
    conteudo: text("conteudo").notNull(),
    contextoVersaoOrigem: integer("contexto_versao_origem"),
    templateIdOrigem: varchar("template_id_origem", { length: 255 }),
    materiaCanonicaOrigem: varchar("materia_canonica_origem", { length: 150 }),
  },
  (table) => [index("idx_versoes_minuta_minuta_id_numero").on(table.minutaId, table.numero)],
);

// ─────────────────────────────────────────────────────────────
// PIPELINE CONTEXT & SNAPSHOTS
// ─────────────────────────────────────────────────────────────
export const pedidoPipelineSnapshot = pgTable(
  "pedido_pipeline_snapshot",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    pedidoId: text("pedido_id").notNull(),
    etapa: text("etapa").notNull(),
    versao: integer("versao").notNull().default(1),
    entradaRef: jsonb("entrada_ref").notNull().default({}),
    saidaEstruturada: jsonb("saida_estruturada").notNull().default({}),
    status: varchar("status", { length: 50 }).notNull().default("pendente"),
    executadoEm: timestamp("executado_em"),
    codigoErro: text("codigo_erro"),
    mensagemErro: text("mensagem_erro"),
    tentativa: integer("tentativa").notNull().default(1),
    criadoEm: timestamp("criado_em").defaultNow().notNull(),
  },
  (table) => [
    index("idx_pedido_pipeline_snapshot_pedido").on(
      table.pedidoId,
      table.etapa,
      table.versao,
    ),
    index("idx_pipeline_snapshot_status_data").on(table.status, table.executadoEm),
  ],
);

export const pedidoContextoJuridico = pgTable("pedido_contexto_juridico", {
  id: uuid("id").primaryKey().defaultRandom(),
  pedidoId: text("pedido_id").notNull().unique(),
  versaoContexto: integer("versao_contexto").notNull().default(1),
  contexto: jsonb("contexto").notNull().default({}),
  criadoEm: timestamp("criado_em").defaultNow().notNull(),
  atualizadoEm: timestamp("atualizado_em").defaultNow().notNull(),
});

export const pedidoContextoJuridicoVersao = pgTable(
  "pedido_contexto_juridico_versao",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    pedidoId: text("pedido_id").notNull(),
    versaoContexto: integer("versao_contexto").notNull(),
    fatosRelevantes: jsonb("fatos_relevantes").notNull().default([]),
    cronologia: jsonb("cronologia").notNull().default([]),
    pontosControvertidos: jsonb("pontos_controvertidos").notNull().default([]),
    documentosChave: jsonb("documentos_chave").notNull().default([]),
    referenciasDocumentais: jsonb("referencias_documentais").notNull().default([]),
    estrategiaSugerida: text("estrategia_sugerida").notNull().default(""),
    teses: jsonb("teses").notNull().default([]),
    validacaoHumanaTesesPendente: boolean("validacao_humana_teses_pendente").notNull().default(true),
    fontesSnapshot: jsonb("fontes_snapshot").notNull().default([]),
    criadoEm: timestamp("criado_em").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("ctx_versao_unique").on(table.pedidoId, table.versaoContexto),
    index("idx_contexto_juridico_versao_pedido").on(table.pedidoId, table.versaoContexto),
  ],
);

export const minutaVersaoContexto = pgTable(
  "minuta_versao_contexto",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    minutaId: text("minuta_id").notNull(),
    versaoId: text("versao_id").notNull().unique(),
    pedidoId: text("pedido_id").notNull(),
    numeroVersao: integer("numero_versao").notNull(),
    contextoVersao: integer("contexto_versao").notNull(),
    templateId: text("template_id"),
    templateNome: text("template_nome"),
    templateVersao: integer("template_versao"),
    tipoPecaCanonica: text("tipo_peca_canonica"),
    materiaCanonica: text("materia_canonica"),
    referenciasDocumentais: jsonb("referencias_documentais").notNull().default([]),
    atualizadoEm: timestamp("atualizado_em").defaultNow().notNull(),
    criadoEm: timestamp("criado_em").defaultNow().notNull(),
  },
  (table) => [
    index("idx_minuta_versao_contexto_pedido").on(table.pedidoId, table.contextoVersao),
    index("idx_minuta_versao_contexto_template").on(table.templateId, table.templateVersao),
  ],
);

// ─────────────────────────────────────────────────────────────
// BIBLIOTECA DE CONHECIMENTO — metadados de documentos
// ─────────────────────────────────────────────────────────────
export const bibliotecaDocumentos = pgTable(
  "biblioteca_documentos",
  {
    id: text("id").primaryKey(),
    titulo: varchar("titulo", { length: 255 }).notNull(),
    tipo: varchar("tipo", { length: 50 }).notNull(),
    subtipo: varchar("subtipo", { length: 100 }),
    fonte: varchar("fonte", { length: 50 }).notNull().default("upload_manual"),
    driveFileId: text("drive_file_id"),
    driveFolderPath: text("drive_folder_path"),
    urlArquivo: text("url_arquivo"),
    mimeType: varchar("mime_type", { length: 100 }),
    tamanhoBytes: bigint("tamanho_bytes", { mode: "number" }),
    chunksGerados: integer("chunks_gerados").notNull().default(0),
    embeddingStatus: varchar("embedding_status", { length: 20 }).notNull().default("pendente"),
    erroProcessamento: text("erro_processamento"),
    processadoEm: timestamp("processado_em", { withTimezone: true }),
    criadoEm: timestamp("criado_em", { withTimezone: true }).defaultNow().notNull(),
  },
);

// ─────────────────────────────────────────────────────────────
// BIBLIOTECA DE CONHECIMENTO — RAG (pgvector)
// ─────────────────────────────────────────────────────────────
export const bibliotecaChunks = pgTable(
  "biblioteca_chunks",
  {
    id: text("id").primaryKey(),
    documentoId: text("documento_id").notNull(),
    sequencia: integer("sequencia").notNull(),
    conteudo: text("conteudo").notNull(),
    embedding: vector("embedding"),
    criadoEm: timestamp("criado_em").defaultNow().notNull(),
  },
  (table) => [
    index("idx_biblioteca_chunks_documento_id").on(table.documentoId),
  ],
);

// ─────────────────────────────────────────────────────────────
// BASE JURÍDICA VIVA — templates, teses, checklists (versionados)
// ─────────────────────────────────────────────────────────────
export const templateJuridicoVersao = pgTable(
  "template_juridico_versao",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    codigo: text("codigo").notNull(),
    nome: text("nome").notNull(),
    versao: integer("versao").notNull(),
    status: varchar("status", { length: 20 }).notNull(),
    tiposPecaCanonica: jsonb("tipos_peca_canonica").notNull().default([]),
    materias: jsonb("materias").notNull().default([]),
    blocos: jsonb("blocos").notNull().default([]),
    clausulasBase: jsonb("clausulas_base").notNull().default({}),
    especializacaoMateria: jsonb("especializacao_materia").notNull().default({}),
    criadoEm: timestamp("criado_em").defaultNow().notNull(),
    atualizadoEm: timestamp("atualizado_em").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("template_juridico_unique").on(table.codigo, table.versao),
    index("idx_template_juridico_codigo_versao").on(table.codigo, table.versao),
    index("idx_template_juridico_status").on(table.status, table.atualizadoEm),
  ],
);

export const teseJuridicaVersao = pgTable(
  "tese_juridica_versao",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    codigo: text("codigo").notNull(),
    titulo: text("titulo").notNull(),
    versao: integer("versao").notNull(),
    status: varchar("status", { length: 20 }).notNull(),
    tiposPecaCanonica: jsonb("tipos_peca_canonica").notNull().default([]),
    materias: jsonb("materias").notNull().default([]),
    palavrasChave: jsonb("palavras_chave").notNull().default([]),
    gatilhos: jsonb("gatilhos").notNull().default([]),
    teseBase: text("tese_base").notNull(),
    fundamentoSintetico: text("fundamento_sintetico").notNull(),
    criadoEm: timestamp("criado_em").defaultNow().notNull(),
    atualizadoEm: timestamp("atualizado_em").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("tese_juridica_unique").on(table.codigo, table.versao),
    index("idx_tese_juridica_codigo_versao").on(table.codigo, table.versao),
    index("idx_tese_juridica_status").on(table.status, table.atualizadoEm),
  ],
);

export const checklistJuridicoVersao = pgTable(
  "checklist_juridico_versao",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    codigo: text("codigo").notNull(),
    descricao: text("descricao").notNull(),
    categoria: varchar("categoria", { length: 20 }).notNull(), // 'obrigatorio' | 'recomendavel'
    blocoEsperado: text("bloco_esperado").notNull(),
    versao: integer("versao").notNull(),
    status: varchar("status", { length: 20 }).notNull(),
    tiposPecaCanonica: jsonb("tipos_peca_canonica").notNull().default([]),
    materias: jsonb("materias").notNull().default([]),
    tokensEsperados: jsonb("tokens_esperados").notNull().default([]),
    criadoEm: timestamp("criado_em").defaultNow().notNull(),
    atualizadoEm: timestamp("atualizado_em").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("checklist_juridico_unique").on(table.codigo, table.versao),
    index("idx_checklist_juridico_codigo_versao").on(table.codigo, table.versao),
    index("idx_checklist_juridico_status").on(table.status, table.atualizadoEm),
  ],
);

// ─────────────────────────────────────────────────────────────
// CLIENTES
// ─────────────────────────────────────────────────────────────
export const clientes = pgTable("clientes", {
  id: varchar("id", { length: 50 }).primaryKey(),
  nome: varchar("nome", { length: 255 }).notNull(),
  tipo: varchar("tipo", { length: 30 }).notNull(),
  cpfCnpj: varchar("cpf_cnpj", { length: 30 }),
  email: varchar("email", { length: 255 }),
  telefone: varchar("telefone", { length: 30 }),
  enderecoJson: jsonb("endereco_json"),
  status: varchar("status", { length: 30 }).notNull().default("ativo"),
  responsavelId: varchar("responsavel_id", { length: 50 }),
  anotacoes: text("anotacoes"),
  criadoEm: timestamp("criado_em").defaultNow().notNull(),
  atualizadoEm: timestamp("atualizado_em").defaultNow().notNull(),
});

// ─────────────────────────────────────────────────────────────
// JURISPRUDÊNCIA
// ─────────────────────────────────────────────────────────────
export const jurisprudencia = pgTable("jurisprudencia", {
  id: varchar("id", { length: 50 }).primaryKey(),
  titulo: varchar("titulo", { length: 500 }).notNull(),
  ementa: text("ementa").notNull(),
  ementaResumida: text("ementa_resumida"),
  tribunal: varchar("tribunal", { length: 100 }).notNull(),
  relator: varchar("relator", { length: 255 }),
  dataJulgamento: varchar("data_julgamento", { length: 20 }),
  tipo: varchar("tipo", { length: 50 }).notNull(),
  materiasJson: jsonb("materias_json").notNull().default([]),
  tese: text("tese"),
  fundamentosLegaisJson: jsonb("fundamentos_legais_json").notNull().default([]),
  urlOrigem: varchar("url_origem", { length: 500 }),
  relevancia: integer("relevancia").notNull().default(3),
  embeddingStatus: varchar("embedding_status", { length: 20 }).notNull().default("pendente"),
  embedding: vector("embedding"),
  criadoEm: timestamp("criado_em").defaultNow().notNull(),
});

// ─────────────────────────────────────────────────────────────
// CONTRATOS
// ─────────────────────────────────────────────────────────────
export const contratos = pgTable("contratos", {
  id: varchar("id", { length: 50 }).primaryKey(),
  casoId: varchar("caso_id", { length: 50 }),
  clienteId: varchar("cliente_id", { length: 50 }),
  titulo: varchar("titulo", { length: 255 }).notNull(),
  tipo: varchar("tipo", { length: 100 }).notNull(),
  status: varchar("status", { length: 50 }).notNull().default("rascunho"),
  objeto: text("objeto").notNull(),
  partesJson: jsonb("partes_json").notNull().default([]),
  clausulasJson: jsonb("clausulas_json").notNull().default([]),
  valorReais: integer("valor_reais"),
  vigenciaInicio: varchar("vigencia_inicio", { length: 20 }),
  vigenciaFim: varchar("vigencia_fim", { length: 20 }),
  conteudoAtual: text("conteudo_atual").notNull().default(""),
  versoesJson: jsonb("versoes_json").notNull().default([]),
  responsavelId: varchar("responsavel_id", { length: 50 }),
  analiseRiscoJson: jsonb("analise_risco_json"),
  criadoEm: timestamp("criado_em").defaultNow().notNull(),
  atualizadoEm: timestamp("atualizado_em").defaultNow().notNull(),
});

// ─────────────────────────────────────────────────────────────
// CONFIGURAÇÕES DO SISTEMA
// ─────────────────────────────────────────────────────────────
export const configuracoesSistema = pgTable("configuracoes_sistema", {
  chave: varchar("chave", { length: 100 }).primaryKey(),
  valor: text("valor").notNull(),
  descricao: text("descricao"),
});

// ─────────────────────────────────────────────────────────────
// INTEGRAÇÕES GOOGLE POR USUÁRIO
// ─────────────────────────────────────────────────────────────
export const googleIntegracoesUsuario = pgTable(
  "google_integracoes_usuario",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").notNull(),
    emailGoogle: varchar("email_google", { length: 255 }),
    accessToken: text("access_token").notNull(),
    refreshToken: text("refresh_token"),
    tokenType: varchar("token_type", { length: 50 }),
    scope: text("scope"),
    expiryDate: timestamp("expiry_date", { withTimezone: true }),
    selectedCalendarId: varchar("selected_calendar_id", { length: 255 }),
    metadata: jsonb("metadata").notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("google_integracoes_usuario_user_unique").on(table.userId),
    index("idx_google_integracoes_usuario_email").on(table.emailGoogle),
  ],
);

export const googleDriveVinculos = pgTable(
  "google_drive_vinculos",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").notNull(),
    driveFileId: text("drive_file_id").notNull(),
    driveFileName: text("drive_file_name").notNull(),
    driveMimeType: text("drive_mime_type"),
    driveWebViewLink: text("drive_web_view_link"),
    tipoEntidade: text("tipo_entidade").$type<"caso" | "pedido" | "cliente">().notNull(),
    entidadeId: text("entidade_id").notNull(),
    entidadeLabel: text("entidade_label").notNull(),
    criadoEm: timestamp("criado_em", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("idx_google_drive_vinculos_user_id").on(table.userId),
    index("idx_google_drive_vinculos_drive_file_id").on(table.driveFileId),
    uniqueIndex("idx_google_drive_vinculos_unique_link").on(
      table.userId,
      table.driveFileId,
      table.tipoEntidade,
      table.entidadeId,
    ),
  ],
);

// ─────────────────────────────────────────────────────────────
// LEGACY TABLES (mantidas para compatibilidade, não adicionar novas aqui)
// ─────────────────────────────────────────────────────────────

/** tesesJuridicas — versão não-versionada (substituída por teseJuridicaVersao) */
export const tesesJuridicas = pgTable("teses_juridicas", {
  id: varchar("id", { length: 100 }).primaryKey(),
  codigo: varchar("codigo", { length: 50 }).notNull(),
  titulo: varchar("titulo", { length: 255 }).notNull(),
  teseBase: text("tese_base").notNull(),
  status: varchar("status", { length: 50 }).notNull(),
  embedding: vector("embedding"),
});
