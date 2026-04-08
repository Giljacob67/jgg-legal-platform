#!/usr/bin/env node

import { readdir } from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(process.cwd(), "src");

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(fullPath)));
      continue;
    }
    files.push(fullPath);
  }

  return files;
}

async function main() {
  const files = await walk(ROOT);
  const withSpaces = files.filter((file) => file.includes(" "));

  if (withSpaces.length === 0) {
    console.log("OK: nenhum arquivo com espaço em src/.");
    return;
  }

  console.error("ERRO: arquivos com espaço detectados em src/:");
  for (const file of withSpaces) {
    console.error(` - ${path.relative(process.cwd(), file)}`);
  }
  process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
