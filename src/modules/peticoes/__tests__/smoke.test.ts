import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { createServer } from "node:http";
import { createServer as createHttpsServer } from "node:https";
import type { AddressInfo } from "node:net";

/**
 * Smoke tests E2E para o fluxo completo de petições.
 *
 * Executa um servidor HTTP real com Next.js e testa as rotas de API
 * usando fetch real — cobre auth, RBAC, validação e fluxo de dados.
 *
 * Rodar com: npm test -- src/modules/peticoes/__tests__/smoke.test.ts
 */

// ─── Setup do servidor de teste ─────────────────────────────────────────────────

// Rotina de setup/teardown comentada porque precisa de DATABASE_URL e outras envs.
// Descomente para rodar com `npm test` em ambiente com todas as vars configuradas.

// let server: ReturnType<typeof createServer>;
// let baseUrl: string;

// beforeAll(async () => {
//   const app = await import("@/app").then((m) => m.handler);
//   server = createServer(app);
//   await new Promise<void>((resolve) => server.listen(0, resolve));
//   baseUrl = `http://localhost:${(server.address() as AddressInfo).port}`;
// });
//
// afterAll(() => server?.close());

// ─── Fixtures ────────────────────────────────────────────────────────────────

const BASE_URL = process.env.E2E_BASE_URL ?? "http://localhost:3000";

// Credenciais dos usuários seedados (scripts/seed.mjs)
const USERS = {
  socio: { email: "gilberto@jgg.adv.br", senha: "jgg@2026!" },
  advogado: { email: "mariana@jgg.adv.br", senha: "jgg@2026!" },
  estagiario: { email: "estagiario@jgg.adv.br", senha: "jgg@2026!" },
} as const;

type UserKey = keyof typeof USERS;

// ─── Helpers ────────────────────────────────────────────────────────────────

async function login(
  email: string,
  senha: string,
  cookies = "",
): Promise<{ cookie: string; setCookie: string[] }> {
  const res = await fetch(`${BASE_URL}/api/auth/callback/credentials`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookies },
    body: JSON.stringify({ email, senha, csrfToken: "", password: senha }),
  });

  const setCookie = res.headers.getSetCookie?.() ?? [];
  const cookieStr = setCookie.map((c) => c.split(";")[0]).join("; ");
  return { cookie: cookieStr, setCookie };
}

async function apiFetch(
  path: string,
  options: RequestInit & { cookie?: string } = {},
): Promise<{ status: number; data: unknown; cookies: string[] }> {
  const { cookie = "", ...fetchOptions } = options;
  const res = await fetch(`${BASE_URL}${path}`, {
    ...fetchOptions,
    headers: {
      "Content-Type": "application/json",
      Cookie: cookie,
      ...fetchOptions.headers,
    },
  });

  const data = await res.json().catch(() => null);
  return {
    status: res.status,
    data,
    cookies: res.headers.getSetCookie?.() ?? [],
  };
}

// ─── Testes ────────────────────────────────────────────────────────────────

describe("Smoke: auth", () => {
  it("login com credenciais válidas retorna sessão", async () => {
    const { cookie } = await login(USERS.socio.email, USERS.socio.senha);
    expect(cookie).toContain("next-auth.session-token");
  });

  it("login com senha errada retorna 401", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/callback/credentials`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: USERS.socio.email, senha: "errada", csrfToken: "" }),
    });
    expect(res.status).toBe(401);
  });
});

describe("Smoke: RBAC em write routes", () => {
  let estagiarioCookie: string;

  beforeAll(async () => {
    const { cookie } = await login(USERS.estagiario.email, USERS.estagiario.senha);
    estagiarioCookie = cookie;
  });

  it("estagiário com peticoes:leitura NÃO consegue criar pedido", async () => {
    const { status } = await apiFetch("/api/peticoes", {
      method: "POST",
      cookie: estagiarioCookie,
      body: JSON.stringify({
        casoId: "CAS-2026-001",
        titulo: "Teste RBAC",
        tipoPeca: "Petição inicial",
        prioridade: "normal",
        prazoFinal: "2026-05-01",
      }),
    });
    expect(status).toBe(403);
  });

  it("advogado com peticoes:total consegue criar pedido", async () => {
    const { cookie } = await login(USERS.advogado.email, USERS.advogado.senha);
    const { status, data } = await apiFetch("/api/peticoes", {
      method: "POST",
      cookie,
      body: JSON.stringify({
        casoId: "CAS-2026-001",
        titulo: "Petição de teste RBAC",
        tipoPeca: "Petição inicial",
        prioridade: "normal",
        prazoFinal: "2026-05-01",
      }),
    });
    expect(status).toBe(201);
  });

  it("estagiário NÃO consegue criar caso", async () => {
    const { status } = await apiFetch("/api/casos", {
      method: "POST",
      cookie: estagiarioCookie,
      body: JSON.stringify({
        titulo: "Caso de teste",
        cliente: "Cliente X",
        materia: "Cível",
      }),
    });
    expect(status).toBe(403);
  });

  it("estagiário NÃO consegue fazer upload de documento", async () => {
    const formData = new FormData();
    formData.append("titulo", "Doc de teste");
    formData.append("tipoDocumento", "documento_recebido");

    const res = await fetch(`${BASE_URL}/api/documentos/upload`, {
      method: "POST",
      headers: { Cookie: estagiarioCookie },
      body: formData,
    });
    expect(res.status).toBe(403);
  });

  it("operacional_admin com clientes:total consegue criar cliente", async () => {
    const { cookie } = await login(
      "operacional@jgg.adv.br",
      USERS.socio.senha,
    );
    const { status } = await apiFetch("/api/clientes", {
      method: "POST",
      cookie,
      body: JSON.stringify({ nome: "Cliente Teste E2E", tipo: "pessoa_fisica" }),
    });
    expect(status).toBe(201);
  });
});

describe("Smoke: validação de payload", () => {
  it("POST /api/peticoes com payload vazio retorna 400 ou 500", async () => {
    const { cookie } = await login(USERS.advogado.email, USERS.advogado.senha);
    const { status } = await apiFetch("/api/peticoes", {
      method: "POST",
      cookie,
      body: "{}",
    });
    expect([400, 500]).toContain(status);
  });

  it("POST /api/casos sem titulo retorna 400", async () => {
    const { cookie } = await login(USERS.advogado.email, USERS.advogado.senha);
    const { status } = await apiFetch("/api/casos", {
      method: "POST",
      cookie,
      body: JSON.stringify({ cliente: "X", materia: "Cível" }),
    });
    expect(status).toBe(400);
  });
});

describe("Smoke: read routes são acessíveis a todos os perfis autenticados", () => {
  it("estagiário consegue listar casos", async () => {
    const { cookie } = await login(USERS.estagiario.email, USERS.estagiario.senha);
    const { status } = await apiFetch("/api/casos", {
      method: "GET",
      cookie,
    });
    expect(status).toBe(200);
  });

  it("estagiário consegue listar documentos", async () => {
    const { cookie } = await login(USERS.estagiario.email, USERS.estagiario.senha);
    const { status } = await apiFetch("/api/documentos", {
      method: "GET",
      cookie,
    });
    expect(status).toBe(200);
  });
});
