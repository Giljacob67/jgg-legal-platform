import {
  pgTable,
  text,
  timestamp,
  varchar,
  uuid,
  integer,
  customType,
} from "drizzle-orm/pg-core";

// Tipo customizado para pgvector
export const vector = customType<{ data: number[]; driverData: string }>({
  dataType() {
    return "vector(1536)"; // Dimensão do modelo OpenAI text-embedding-3-small / ada-002
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
// USERS E AUTHENTICATION
// ─────────────────────────────────────────────────────────────
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  initials: varchar("initials", { length: 10 }),
  role: varchar("role", { length: 100 }), // Ex: 'Advogado', 'Sócio / Direção'
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─────────────────────────────────────────────────────────────
// CASOS JURÍDICOS E SEUS DETALHES
// ─────────────────────────────────────────────────────────────
export const casos = pgTable("casos", {
  id: varchar("id", { length: 50 }).primaryKey(), // Ex: 'CAS-2026-001'
  titulo: varchar("titulo", { length: 255 }).notNull(),
  cliente: varchar("cliente", { length: 255 }).notNull(),
  materia: varchar("materia", { length: 100 }).notNull(),
  tribunal: varchar("tribunal", { length: 100 }),
  status: varchar("status", { length: 50 }).notNull(), // 'novo', 'em análise', etc.
  prazoFinal: timestamp("prazo_final"), // "2026-03-31" etc.
  resumo: text("resumo"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const partes = pgTable("partes", {
  id: uuid("id").primaryKey().defaultRandom(),
  casoId: varchar("caso_id", { length: 50 }).references(() => casos.id, { onDelete: "cascade" }),
  nome: varchar("nome", { length: 255 }).notNull(),
  papel: varchar("papel", { length: 50 }).notNull(), // 'autor', 'réu', 'terceiro'
});

export const eventosCaso = pgTable("eventos_caso", {
  id: varchar("id", { length: 50 }).primaryKey(), // Ex: 'EV-001'
  casoId: varchar("caso_id", { length: 50 }).references(() => casos.id, { onDelete: "cascade" }),
  data: timestamp("data").notNull(),
  descricao: text("descricao").notNull(),
});

// ─────────────────────────────────────────────────────────────
// PEÇAS, PIPELINE E DOCUMENTOS
// ─────────────────────────────────────────────────────────────
export const pedidosPeca = pgTable("pedidos_peca", {
  id: varchar("id", { length: 50 }).primaryKey(), // Ex: 'PED-2026-001'
  casoId: varchar("caso_id", { length: 50 }).references(() => casos.id, { onDelete: "cascade" }),
  titulo: varchar("titulo", { length: 255 }).notNull(),
  tipoPeca: varchar("tipo_peca", { length: 150 }).notNull(),
  prioridade: varchar("prioridade", { length: 50 }).notNull(),
  status: varchar("status", { length: 50 }).notNull(), // 'em triagem', 'em produção', etc.
  etapaAtual: varchar("etapa_atual", { length: 100 }).notNull(),
  responsavel: varchar("responsavel", { length: 255 }),
  prazoFinal: timestamp("prazo_final"),
  criadoEm: timestamp("criado_em").defaultNow().notNull(),
});

export const historicoPipeline = pgTable("historico_pipeline", {
  id: varchar("id", { length: 50 }).primaryKey(), // Ex: 'HIS-001'
  pedidoId: varchar("pedido_id", { length: 50 }).references(() => pedidosPeca.id, { onDelete: "cascade" }),
  etapa: varchar("etapa", { length: 100 }).notNull(),
  descricao: text("descricao").notNull(),
  data: timestamp("data").notNull(),
  responsavel: varchar("responsavel", { length: 255 }),
});

export const minutas = pgTable("minutas", {
  id: varchar("id", { length: 50 }).primaryKey(), // Ex: 'MIN-001'
  pedidoId: varchar("pedido_id", { length: 50 }).references(() => pedidosPeca.id, { onDelete: "cascade" }),
  titulo: varchar("titulo", { length: 255 }).notNull(),
  conteudoAtual: text("conteudo_atual"),
});

export const versoesMinuta = pgTable("versoes_minuta", {
  id: varchar("id", { length: 50 }).primaryKey(), // Ex: 'VER-001'
  minutaId: varchar("minuta_id", { length: 50 }).references(() => minutas.id, { onDelete: "cascade" }),
  numero: integer("numero").notNull(),
  criadoEm: timestamp("criado_em").defaultNow().notNull(),
  autor: varchar("autor", { length: 255 }).notNull(),
  resumoMudancas: text("resumo_mudancas"),
  conteudo: text("conteudo").notNull(),
  
  // Rastreabilidade de IA e Inteligência Jurídica
  contextoVersaoOrigem: integer("contexto_versao_origem"),
  templateIdOrigem: varchar("template_id_origem", { length: 255 }),
  materiaCanonicaOrigem: varchar("materia_canonica_origem", { length: 150 }),
});

// ─────────────────────────────────────────────────────────────
// BIBLIOTECA DE CONHECIMENTO — CHUNKS VETORIZADOS (RAG)
// ─────────────────────────────────────────────────────────────
export const bibliotecaChunks = pgTable("biblioteca_chunks", {
  id: text("id").primaryKey(), // UUID como text para compatibilidade com raw SQL
  documentoId: text("documento_id").notNull(),
  sequencia: integer("sequencia").notNull(),
  conteudo: text("conteudo").notNull(),
  embedding: vector("embedding"), // vector(1536) — OpenAI text-embedding-3-small
  criadoEm: timestamp("criado_em").defaultNow().notNull(),
});

// ─────────────────────────────────────────────────────────────
// INTELIGÊNCIA VIVA (CATÁLOGOS)
// ─────────────────────────────────────────────────────────────
export const tesesJuridicas = pgTable("teses_juridicas", {
  id: varchar("id", { length: 100 }).primaryKey(), // 'tese-juros-v1'
  codigo: varchar("codigo", { length: 50 }).notNull(),
  titulo: varchar("titulo", { length: 255 }).notNull(),
  teseBase: text("tese_base").notNull(),
  status: varchar("status", { length: 50 }).notNull(), // 'ativo', 'arquivado'
  embedding: vector("embedding"), // pgvector para Busca Semântica RAG
});
