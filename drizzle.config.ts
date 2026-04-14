import type { Config } from "drizzle-kit";
import * as dotenv from "dotenv";
dotenv.config();

// ─────────────────────────────────────────────────────────────
// SISTEMA DE MIGRATIONS
// ─────────────────────────────────────────────────────────────
// As migrations são gerenciadas manualmente em db/migrations/
// e aplicadas via: npm run db:migrate  (scripts/run-migrations.mjs)
//
// Este arquivo é usado APENAS por:
//   - drizzle-kit studio  (inspeção do schema)
//   - drizzle-kit check   (verificação de integridade)
//   - drizzle-kit generate (gera SQL novo em db/migrations/ — revisar antes de aplicar)
//
// NÃO use "drizzle-kit migrate" — use "npm run db:migrate".
// ─────────────────────────────────────────────────────────────

export default {
  schema: "./src/lib/database/schema.ts",
  out: "./db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/jgg_legal",
  },
} satisfies Config;
