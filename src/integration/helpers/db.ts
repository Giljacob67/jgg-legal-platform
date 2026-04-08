import { getSqlClient } from "@/lib/database/client";

const CORE_TABLES = [
  "pipeline_execution_control",
  "api_rate_limit",
  "audit_log",
  "minuta_versao_contexto",
  "pedido_contexto_juridico_versao",
  "pedido_pipeline_snapshot",
  "documento_processamento_etapa",
  "documento_vinculo",
  "documento_juridico",
  "arquivo_fisico",
  "versoes_minuta",
  "minutas",
  "historico_pipeline",
  "pedidos_peca",
  "eventos_caso",
  "partes",
  "casos",
  "contratos",
  "clientes",
  "jurisprudencia",
  "configuracoes_sistema",
  "users",
] as const;

export function uniqueId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
}

export async function assertMigrationsApplied(): Promise<void> {
  const sql = getSqlClient();

  try {
    const [row] = await sql<{ count: number }[]>`
      SELECT COUNT(*)::int AS count
      FROM schema_migrations
    `;

    if (!row || row.count <= 0) {
      throw new Error("Nenhuma migration encontrada em schema_migrations.");
    }
  } catch (error) {
    throw new Error(
      `Banco sem migrations aplicadas para testes de integração. Detalhe: ${
        error instanceof Error ? error.message : "erro desconhecido"
      }`,
    );
  }
}

export async function truncateCoreTables(): Promise<void> {
  const sql = getSqlClient();
  const rows = await sql<{ tablename: string }[]>`
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
  `;
  const existing = new Set(rows.map((row) => row.tablename));
  const tables = CORE_TABLES.filter((table) => existing.has(table));

  if (tables.length === 0) {
    return;
  }

  const quoted = tables.map((table) => `"${table}"`).join(", ");
  await sql.unsafe(`TRUNCATE TABLE ${quoted} RESTART IDENTITY CASCADE`);
}
