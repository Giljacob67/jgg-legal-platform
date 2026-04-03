import "server-only";

import postgres, { type Sql } from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

let sqlClient: Sql | null = null;
let dbInstance: ReturnType<typeof drizzle<typeof schema>> | null = null;

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

export function getDb() {
  if (dbInstance) return dbInstance;
  
  const sql = getSqlClient();
  dbInstance = drizzle(sql, { schema });
  return dbInstance;
}
