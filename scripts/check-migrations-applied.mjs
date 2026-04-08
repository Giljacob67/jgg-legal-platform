#!/usr/bin/env node

import { readdir } from "node:fs/promises";
import path from "node:path";
import postgres from "postgres";

async function main() {
  const databaseUrl =
    process.env.MIGRATION_CHECK_DATABASE_URL ??
    process.env.TEST_DATABASE_URL ??
    process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error(
      "Nenhuma URL de banco informada. Defina MIGRATION_CHECK_DATABASE_URL, TEST_DATABASE_URL ou DATABASE_URL.",
    );
  }

  const migrationsDir = path.resolve(process.cwd(), "db", "migrations");
  const files = (await readdir(migrationsDir))
    .filter((file) => file.endsWith(".sql"))
    .sort();

  const sql = postgres(databaseUrl, {
    max: 1,
    prepare: false,
  });

  try {
    const tableCheck = await sql`
      SELECT to_regclass('public.schema_migrations')::text AS regclass
    `;
    if (!tableCheck[0]?.regclass) {
      throw new Error("Tabela schema_migrations não existe no banco alvo.");
    }

    const appliedRows = await sql`
      SELECT id
      FROM schema_migrations
    `;
    const applied = new Set(appliedRows.map((row) => row.id));
    const expected = new Set(files);

    const missing = files.filter((file) => !applied.has(file));
    const unknownApplied = [...applied].filter((id) => !expected.has(id)).sort();

    if (missing.length > 0) {
      console.error("⛔ Migrations pendentes no banco:");
      for (const item of missing) {
        console.error(` - ${item}`);
      }
      process.exit(1);
    }

    if (unknownApplied.length > 0) {
      console.warn("⚠️ Migrations registradas no banco e ausentes no repositório atual:");
      for (const item of unknownApplied) {
        console.warn(` - ${item}`);
      }
    }

    console.log(
      `OK: todas as migrations do repositório foram aplicadas (${files.length} arquivos em db/migrations).`,
    );
  } finally {
    await sql.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
