import { test, expect, type Page } from "@playwright/test";

async function loginAs(page: Page, email: string, senha = "jgg2026") {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Senha").fill(senha);
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL("/dashboard", { timeout: 15000 });
}

test.describe("RBAC Smoke", () => {
  test("advogado deve ser redirecionado para sem permissão ao abrir administração", async ({ page }) => {
    await loginAs(page, "mariana@jgg.com.br");

    await page.goto("/administracao");
    await expect(page).toHaveURL(/\/sem-permissao/);
    await expect(page.getByRole("heading", { level: 1, name: "Acesso não permitido" })).toBeVisible();
  });

  test("sócio deve acessar a área de administração", async ({ page }) => {
    await loginAs(page, "gilberto@jgg.com.br");

    await page.goto("/administracao");
    await expect(page).toHaveURL("/administracao");
    await expect(page.getByRole("heading", { level: 1, name: "Administração" })).toBeVisible();
  });

  test("operacional deve receber 403 em endpoint de governança de petições", async ({ page }) => {
    await loginAs(page, "operacional@jgg.com.br");

    const response = await page.request.get("/api/peticoes/governanca/responsaveis");
    expect(response.status()).toBe(403);
  });

  test("advogado deve acessar endpoint de governança de petições", async ({ page }) => {
    await loginAs(page, "mariana@jgg.com.br");

    const response = await page.request.get("/api/peticoes/governanca/responsaveis");
    expect(response.status()).toBe(200);
  });

  test("advogado não deve ter alçada para aprovar pipeline", async ({ page }) => {
    await loginAs(page, "mariana@jgg.com.br");

    await page.goto("/peticoes/pipeline/PED-2026-001");
    await expect(page.getByRole("heading", { level: 1, name: "Pipeline da Peça" })).toBeVisible();
    await expect(page.getByText("Seu perfil não possui alçada para aprovação final.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Aprovar" })).toHaveCount(0);

    const response = await page.request.post("/api/peticoes/pipeline/PED-2026-001/aprovacao", {
      data: { resultado: "aprovado", observacoes: "Teste RBAC sem alçada" },
    });
    expect(response.status()).toBe(403);
  });

  test("sócio deve conseguir aprovar pipeline", async ({ page }) => {
    await loginAs(page, "gilberto@jgg.com.br");

    await page.goto("/peticoes/pipeline/PED-2026-001");
    await expect(page.getByRole("heading", { level: 1, name: "Pipeline da Peça" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Aprovar" })).toBeVisible();

    const response = await page.request.post("/api/peticoes/pipeline/PED-2026-001/aprovacao", {
      data: { resultado: "aprovado", observacoes: "Teste RBAC com alçada" },
    });
    expect(response.status()).toBe(200);
  });

  test("administrador aprova pipeline, mas não executa estágio", async ({ page }) => {
    await loginAs(page, "admin@jgg.com.br");

    await page.goto("/peticoes/pipeline/PED-2026-001");
    await expect(page.getByRole("heading", { level: 1, name: "Pipeline da Peça" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Sem alçada para execução" }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Aprovar" })).toBeVisible();

    const execResponse = await page.request.post("/api/peticoes/pipeline/PED-2026-001/executar/triagem");
    expect(execResponse.status()).toBe(403);

    const aprovacaoResponse = await page.request.post("/api/peticoes/pipeline/PED-2026-001/aprovacao", {
      data: { resultado: "aprovado", observacoes: "Aprovação por administrador em smoke RBAC." },
    });
    expect(aprovacaoResponse.status()).toBe(200);
  });
});
