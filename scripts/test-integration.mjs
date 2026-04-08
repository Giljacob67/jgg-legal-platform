import { spawnSync } from "node:child_process";

function run(cmd, args, env) {
  const result = spawnSync(cmd, args, {
    stdio: "inherit",
    env,
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function main() {
  const testDatabaseUrl = process.env.TEST_DATABASE_URL;
  if (!testDatabaseUrl) {
    console.error(
      "⛔ TEST_DATABASE_URL não definida. Configure uma base dedicada para integração (Postgres + pgvector).",
    );
    process.exit(1);
  }

  const env = {
    ...process.env,
    DATA_MODE: "real",
    DATABASE_URL: testDatabaseUrl,
    NODE_ENV: "test",
  };

  console.log("🧪 Executando migrations para suíte de integração...");
  run("node", ["scripts/run-migrations.mjs"], env);

  console.log("🧪 Executando testes de integração (real DB)...");
  const npxCmd = process.platform === "win32" ? "npx.cmd" : "npx";
  run(npxCmd, ["vitest", "run", "-c", "vitest.integration.config.ts"], env);
}

main();
