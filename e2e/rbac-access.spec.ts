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
});
