#!/usr/bin/env node
/**
 * Script para gerar hash bcrypt de senha de demo.
 * Uso: node scripts/generate-bcrypt-hash.mjs "sua-senha"
 */
import { hash } from "bcrypt";

const password = process.argv[2];

if (!password) {
  console.error("Uso: node scripts/generate-bcrypt-hash.mjs <senha>");
  process.exit(1);
}

const hashResult = await hash(password, 12);
console.log(`Senha: ${password}`);
console.log(`Hash bcrypt: ${hashResult}`);
console.log("\nCole o hash no DEMO_USERS_JSON do .env:");
console.log(
  JSON.stringify(
    [
      {
        id: "usr-adv-001",
        email: "mariana@jgg.com.br",
        passwordHash: hashResult,
        name: "Mariana Couto",
        initials: "MC",
        role: "advogado",
      },
    ],
    null,
    2,
  ),
);
