import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import postgres from "postgres";

async function main() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL não definida. Configure a variável para rodar as migrations.");
  }

  const sql = postgres(databaseUrl, {
    max: 1,
    prepare: false,
  });

  try {
    await sql`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id TEXT PRIMARY KEY,
        executado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;

    const migrationsDir = path.resolve(process.cwd(), "db", "migrations");
    const migrationFiles = (await readdir(migrationsDir))
      .filter((file) => file.endsWith(".sql"))
      .sort();

    for (const fileName of migrationFiles) {
      const [{ count }] = await sql`
        SELECT COUNT(*)::int AS count
        FROM schema_migrations
        WHERE id = ${fileName}
      `;

      if (count > 0) {
        continue;
      }

      const migrationPath = path.join(migrationsDir, fileName);
      const migrationSql = await readFile(migrationPath, "utf-8");

      await sql.begin(async (trx) => {
        await trx.unsafe(migrationSql);
        await trx`
          INSERT INTO schema_migrations (id)
          VALUES (${fileName})
        `;
      });

      console.log(`Migration aplicada: ${fileName}`);
    }

    console.log("Migrations concluídas.");
  } finally {
    await sql.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
