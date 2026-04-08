#!/usr/bin/env node

import { spawnSync } from "node:child_process";

const steps = [
  { name: "Sem arquivos com espaço", cmd: "npm", args: ["run", "check:no-space-files"] },
  { name: "Drift de schema", cmd: "npm", args: ["run", "check:schema-drift"] },
  { name: "Lint", cmd: "npm", args: ["run", "lint"] },
  { name: "Typecheck", cmd: "npm", args: ["run", "typecheck"] },
  { name: "Build", cmd: "npm", args: ["run", "build"] },
  { name: "Testes unitários", cmd: "npm", args: ["run", "test"] },
  { name: "Testes E2E", cmd: "npm", args: ["run", "test:e2e"] },
];

const shouldRunIntegration = Boolean(process.env.TEST_DATABASE_URL);
const requireIntegration = process.env.REQUIRE_INTEGRATION_TESTS === "true";
const migrationCheckDbUrl =
  process.env.MIGRATION_CHECK_DATABASE_URL ?? process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL;

if (migrationCheckDbUrl) {
  steps.splice(2, 0, {
    name: "Migrations aplicadas no banco",
    cmd: "npm",
    args: ["run", "check:migrations-applied"],
    env: { MIGRATION_CHECK_DATABASE_URL: migrationCheckDbUrl },
  });
} else if (requireIntegration) {
  console.error(
    "⛔ REQUIRE_INTEGRATION_TESTS=true, mas nenhuma URL de banco foi definida para check de migrations.",
  );
  process.exit(1);
} else {
  console.warn("⚠️  Nenhuma URL de banco definida. Check de migrations aplicadas foi ignorado.");
}

if (shouldRunIntegration) {
  steps.push({
    name: "Testes de integração (DB real)",
    cmd: "npm",
    args: ["run", "test:integration"],
  });
} else if (requireIntegration) {
  console.error("⛔ REQUIRE_INTEGRATION_TESTS=true, mas TEST_DATABASE_URL não foi definida.");
  process.exit(1);
} else {
  console.warn("⚠️  TEST_DATABASE_URL não definida. Etapa de integração foi ignorada neste ambiente.");
}

function runStep(step) {
  console.log(`\n▶ ${step.name}`);
  const result = spawnSync(step.cmd, step.args, {
    stdio: "inherit",
    shell: false,
    env: {
      ...process.env,
      ...(step.env ?? {}),
    },
  });

  if (result.status !== 0) {
    console.error(`\n❌ Falha em: ${step.name}`);
    process.exit(result.status ?? 1);
  }
  console.log(`✅ ${step.name}`);
}

console.log("=== Release Readiness Check ===");
console.log(`Data/Hora: ${new Date().toISOString()}`);

for (const step of steps) {
  runStep(step);
}

console.log("\n✅ Release readiness concluído com sucesso.");
