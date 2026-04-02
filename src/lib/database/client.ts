import "server-only";

import postgres, { type Sql } from "postgres";

let sqlClient: Sql | null = null;

export function getSqlClient(): Sql {
  if (sqlClient) {
    return sqlClient;
  }

  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL não definida para operação em DATA_MODE=real.");
  }

  sqlClient = postgres(databaseUrl, {
    prepare: false,
  });

  return sqlClient;
}
