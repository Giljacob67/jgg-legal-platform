#!/usr/bin/env node

import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const SCHEMA_FILE = path.resolve(process.cwd(), "src", "lib", "database", "schema.ts");
const MIGRATIONS_DIR = path.resolve(process.cwd(), "db", "migrations");

async function main() {
  const schemaSource = await readFile(SCHEMA_FILE, "utf-8");
  const tableMatches = [...schemaSource.matchAll(/pgTable\("([^"]+)"/g)];
  const tables = new Set(tableMatches.map((match) => match[1]));

  if (tables.size === 0) {
    throw new Error("Nenhuma tabela encontrada em schema.ts.");
  }

  const migrationFiles = (await readdir(MIGRATIONS_DIR))
    .filter((file) => file.endsWith(".sql"))
    .sort();

  if (migrationFiles.length === 0) {
    throw new Error("Nenhuma migration encontrada em db/migrations.");
  }

  let migrationSql = "";
  for (const file of migrationFiles) {
    migrationSql += `\n-- ${file}\n`;
    migrationSql += await readFile(path.join(MIGRATIONS_DIR, file), "utf-8");
    migrationSql += "\n";
  }

  const missingTables = [];
  for (const table of tables) {
    const pattern = new RegExp(`CREATE\\s+TABLE\\s+IF\\s+NOT\\s+EXISTS\\s+${table}\\b`, "i");
    if (!pattern.test(migrationSql)) {
      missingTables.push(table);
    }
  }

  if (missingTables.length > 0) {
    console.error("ERRO: tabelas presentes no schema.ts sem CREATE TABLE correspondente em db/migrations:");
    for (const table of missingTables) {
      console.error(` - ${table}`);
    }
    process.exit(1);
  }

  console.log(
    `OK: schema e migrations alinhados no nível de existência de tabelas (${tables.size} tabelas, ${migrationFiles.length} migrations).`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
