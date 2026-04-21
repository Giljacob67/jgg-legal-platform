import { test, expect } from "@playwright/test";

test.describe("Petições Flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill("mariana@jgg.com.br");
    await page.getByLabel("Senha").fill("jgg2026");
    await page.getByRole("button", { name: "Entrar" }).click();
    await page.waitForURL("/dashboard", { timeout: 10000 });
  });

  test("should navigate to petições page and see existing pedidos", async ({ page }) => {
    await page.goto("/peticoes");
    await expect(page.getByRole("heading", { level: 1, name: "Petições" })).toBeVisible();
  });

  test("should navigate to novo pedido form", async ({ page }) => {
    await page.goto("/peticoes");
    await page.getByRole("link", { name: "Novo pedido de peça" }).click();
    await page.waitForURL("/peticoes/novo", { timeout: 10000 });
    await expect(page.getByRole("heading", { level: 1, name: "Novo Pedido de Peça" })).toBeVisible();
  });

  test("should navigate to pipeline view of a pedido", async ({ page }) => {
    await page.goto("/peticoes");
    const abrirPipeline = page.getByRole("link", { name: "Abrir pipeline" }).first();
    await expect(abrirPipeline).toBeVisible();
    await abrirPipeline.click();
    await expect(page.getByRole("heading", { level: 1, name: "Pipeline da Peça" })).toBeVisible();
  });
});
