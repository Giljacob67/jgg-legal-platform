const testDatabaseUrl = process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL;

if (!testDatabaseUrl) {
  throw new Error(
    "TEST_DATABASE_URL (ou DATABASE_URL) não definida para testes de integração com banco real.",
  );
}

Object.assign(process.env, {
  NODE_ENV: "test",
  DATA_MODE: "real",
  DATABASE_URL: testDatabaseUrl,
});
