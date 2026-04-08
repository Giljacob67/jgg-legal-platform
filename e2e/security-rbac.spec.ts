import { expect, test, type Page } from "@playwright/test";

const PASSWORD = process.env.E2E_LOGIN_PASSWORD ?? "dev-only-change-me";

const USERS = {
  advogado: process.env.E2E_LOGIN_EMAIL ?? "mariana@jgg.com.br",
  estagiario: "estagiario@jgg.com.br",
} as const;

async function login(page: Page, email: string) {
  await page.goto("/login");
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL("/dashboard", { timeout: 30000 });
}

test.describe("RBAC & Escopo de Recurso", () => {
  test("estagiário não pode executar estágio de pipeline", async ({ page }) => {
    await login(page, USERS.estagiario);

    const res = await page.request.post("/api/peticoes/pipeline/PED-2026-001/executar/triagem");
    expect(res.status()).toBe(403);
    const body = await res.json();
    expect(body.code).toBe("FORBIDDEN");
  });

  test("advogado não pode aprovar pedido fora do próprio escopo", async ({ page }) => {
    await login(page, USERS.advogado);

    const res = await page.request.post("/api/peticoes/pipeline/PED-2026-007/aprovar", {
      data: { comentario: "Tentativa de aprovação fora do escopo." },
    });
    expect(res.status()).toBe(403);
    const body = await res.json();
    expect(body.code).toBe("FORBIDDEN");
  });

  test("advogado acessa contrato próprio e recebe 403 em contrato de outro usuário", async ({ page }) => {
    await login(page, USERS.advogado);

    const listarRes = await page.request.get("/api/contratos");
    expect(listarRes.ok()).toBe(true);
    const listarBody = await listarRes.json();
    expect(Array.isArray(listarBody.contratos)).toBe(true);
    expect(listarBody.contratos.length).toBeGreaterThan(0);
    for (const contrato of listarBody.contratos as Array<{ responsavelId?: string }>) {
      expect(contrato.responsavelId).toBe("usr-adv-001");
    }

    const proprioRes = await page.request.get("/api/contratos/CTR-2026-002");
    expect(proprioRes.status()).toBe(200);

    const outroRes = await page.request.get("/api/contratos/CTR-2026-001");
    expect(outroRes.status()).toBe(403);
    const body = await outroRes.json();
    expect(body.code).toBe("FORBIDDEN");
  });
});
