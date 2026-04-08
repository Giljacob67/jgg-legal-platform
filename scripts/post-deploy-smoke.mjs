#!/usr/bin/env node

const DEFAULT_TIMEOUT_MS = 30000;

function normalizeBaseUrl(value) {
  if (!value || typeof value !== "string") {
    return "";
  }
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

function parseArgs(argv) {
  const parsed = {};
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (!token.startsWith("--")) continue;
    const key = token.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith("--")) {
      parsed[key] = "true";
      continue;
    }
    parsed[key] = next;
    i++;
  }
  return parsed;
}

function splitSetCookie(headerValue) {
  if (!headerValue) return [];
  return headerValue.split(/,(?=[^;]+=[^;]+)/g).map((part) => part.trim()).filter(Boolean);
}

class CookieJar {
  constructor() {
    this.cookies = new Map();
  }

  capture(headers) {
    const setCookies = typeof headers.getSetCookie === "function"
      ? headers.getSetCookie()
      : splitSetCookie(headers.get("set-cookie"));

    for (const line of setCookies) {
      const [cookiePair] = line.split(";");
      const idx = cookiePair.indexOf("=");
      if (idx <= 0) continue;
      const name = cookiePair.slice(0, idx).trim();
      const value = cookiePair.slice(idx + 1).trim();
      if (value) this.cookies.set(name, value);
    }
  }

  toHeader() {
    return [...this.cookies.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
  }
}

async function readJsonSafe(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

async function readTextSafe(response) {
  try {
    return await response.text();
  } catch {
    return "";
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help === "true") {
    console.log(`
Uso:
  BASE_URL=https://seu-deploy.vercel.app SMOKE_EMAIL=... SMOKE_PASSWORD=... npm run smoke:deploy

Parâmetros opcionais:
  --base-url <url>         Sobrescreve BASE_URL
  --email <email>          Sobrescreve SMOKE_EMAIL
  --password <senha>       Sobrescreve SMOKE_PASSWORD
  --case-id <id>           Caso usado na triagem (default: CAS-2026-001)
  --timeout-ms <ms>        Timeout por request (default: 30000)
  --allow-non-admin-audit  Não falha se usuário não puder ler auditoria
`);
    process.exit(0);
  }

  const baseUrl = normalizeBaseUrl(args["base-url"] ?? process.env.BASE_URL);
  const email = args.email ?? process.env.SMOKE_EMAIL ?? process.env.E2E_LOGIN_EMAIL ?? "gilberto@jgg.com.br";
  const password = args.password ?? process.env.SMOKE_PASSWORD ?? process.env.E2E_LOGIN_PASSWORD ?? "dev-only-change-me";
  const caseId = args["case-id"] ?? process.env.SMOKE_CASE_ID ?? "CAS-2026-001";
  const timeoutMs = Number(args["timeout-ms"] ?? process.env.SMOKE_TIMEOUT_MS ?? DEFAULT_TIMEOUT_MS);
  const requireAdminAudit = args["allow-non-admin-audit"] !== "true";

  if (!baseUrl) {
    throw new Error("BASE_URL não informado. Exemplo: BASE_URL=https://meu-preview.vercel.app npm run smoke:deploy");
  }
  if (!email || !password) {
    throw new Error("Credenciais ausentes. Defina SMOKE_EMAIL e SMOKE_PASSWORD.");
  }

  const jar = new CookieJar();

  async function request(path, options = {}) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    const headers = new Headers(options.headers ?? {});
    const cookieHeader = jar.toHeader();
    if (cookieHeader) headers.set("cookie", cookieHeader);

    try {
      const response = await fetch(`${baseUrl}${path}`, {
        method: options.method ?? "GET",
        headers,
        body: options.body,
        redirect: options.redirect ?? "manual",
        signal: controller.signal,
      });
      jar.capture(response.headers);
      return response;
    } finally {
      clearTimeout(timeout);
    }
  }

  function assertStatus(response, expected, context) {
    const expectedList = Array.isArray(expected) ? expected : [expected];
    if (!expectedList.includes(response.status)) {
      throw new Error(`${context}: status ${response.status} (esperado: ${expectedList.join(", ")})`);
    }
  }

  console.log("== Smoke pós-deploy ==");
  console.log(`Base URL: ${baseUrl}`);
  console.log(`Usuário: ${email}`);

  const rootRes = await request("/", { method: "GET" });
  assertStatus(rootRes, [200, 307, 308], "Home");
  console.log(`✔ Home respondeu ${rootRes.status}`);

  const csrfRes = await request("/api/auth/csrf", { method: "GET" });
  assertStatus(csrfRes, 200, "CSRF");
  const csrfBody = await readJsonSafe(csrfRes);
  const csrfToken = csrfBody?.csrfToken;
  if (!csrfToken || typeof csrfToken !== "string") {
    throw new Error("CSRF token ausente em /api/auth/csrf.");
  }
  console.log("✔ CSRF token obtido");

  const form = new URLSearchParams();
  form.set("csrfToken", csrfToken);
  form.set("email", email);
  form.set("password", password);
  form.set("callbackUrl", `${baseUrl}/dashboard`);
  form.set("json", "true");

  const loginRes = await request("/api/auth/callback/credentials", {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
    },
    body: form.toString(),
  });
  assertStatus(loginRes, [200, 302], "Login");
  console.log(`✔ Login respondeu ${loginRes.status}`);

  const sessionRes = await request("/api/auth/session", { method: "GET" });
  assertStatus(sessionRes, 200, "Session");
  const sessionBody = await readJsonSafe(sessionRes);
  const sessionEmail = sessionBody?.user?.email;
  if (!sessionEmail) {
    throw new Error("Sessão não estabelecida após login.");
  }
  console.log(`✔ Sessão ativa: ${sessionEmail}`);

  const triagemRes = await request("/api/agents/triagem", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      casoId: caseId,
      descricaoProblema:
        "Smoke test pós deploy: validar fluxo mínimo de triagem e execução do pipeline.",
    }),
  });
  assertStatus(triagemRes, 200, "Triagem");
  const triagemBody = await readJsonSafe(triagemRes);
  const pedidoId = triagemBody?.pedidoCriado;
  if (!pedidoId || typeof pedidoId !== "string") {
    throw new Error("Triagem não retornou pedidoCriado.");
  }
  console.log(`✔ Triagem criou pedido ${pedidoId}`);

  const vinculos = JSON.stringify([
    { tipoEntidade: "caso", entidadeId: caseId, papel: "principal" },
    { tipoEntidade: "pedido_peca", entidadeId: pedidoId, papel: "principal" },
  ]);
  const formData = new FormData();
  formData.set(
    "file",
    new Blob(["Documento de smoke pós-deploy para validar upload e vínculo."], { type: "text/plain" }),
    "smoke-documento.txt",
  );
  formData.set("titulo", "Documento Smoke Pós-Deploy");
  formData.set("tipoDocumento", "Petição");
  formData.set("vinculos", vinculos);

  const uploadRes = await request("/api/documentos/upload", {
    method: "POST",
    body: formData,
  });
  assertStatus(uploadRes, 200, "Upload");
  const uploadBody = await readJsonSafe(uploadRes);
  if (!uploadBody?.documentoId) {
    throw new Error("Upload não retornou documentoId.");
  }
  console.log(`✔ Upload efetuado (${uploadBody.documentoId})`);

  const executeRes = await request(`/api/peticoes/pipeline/${pedidoId}/executar/triagem`, {
    method: "POST",
  });
  assertStatus(executeRes, [200, 409], "Execução de estágio");
  if (executeRes.status === 200) {
    const text = await readTextSafe(executeRes);
    if (!text || text.length < 10) {
      throw new Error("Execução retornou resposta vazia.");
    }
    console.log("✔ Execução de estágio concluída");
  } else {
    console.log("✔ Execução de estágio retornou 409 (lock/idempotência ativa)");
  }

  const auditRes = await request(
    "/api/administracao/auditoria?limit=20&fromHours=24&resource=peticoes.pipeline.estagio&action=execute",
    { method: "GET" },
  );

  if (auditRes.status === 403 && !requireAdminAudit) {
    console.log("⚠ Auditoria não acessível para este perfil (403), ignorado por configuração.");
  } else {
    assertStatus(auditRes, 200, "Auditoria");
    const auditBody = await readJsonSafe(auditRes);
    const logs = Array.isArray(auditBody?.logs) ? auditBody.logs : [];
    if (logs.length === 0) {
      throw new Error("Auditoria retornou lista vazia para filtro de execução.");
    }
    console.log(`✔ Auditoria retornou ${logs.length} evento(s) de execução`);
  }

  console.log("✅ Smoke pós-deploy concluído com sucesso.");
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`❌ Smoke falhou: ${message}`);
  process.exit(1);
});
