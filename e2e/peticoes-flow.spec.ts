import { test, expect } from "@playwright/test";

test.describe("Petições Flow", () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto("/login");
    await page.fill('input[type="email"]', "mariana@jgg.com.br");
    await page.fill('input[type="password"]', "jgg2026");
    await page.click('button[type="submit"]');
    await page.waitForURL("/dashboard", { timeout: 10000 });
  });

  test("should navigate to petições page and see existing pedidos", async ({ page }) => {
    await page.goto("/peticoes");
    await expect(page.locator("h1")).toContainText("Petições");
  });

  test("should navigate to novo pedido form", async ({ page }) => {
    await page.goto("/peticoes/novo");
    await expect(page.locator("text=Novo pedido")).toBeVisible();
  });

  test("should navigate to pipeline view of a pedido", async ({ page }) => {
    await page.goto("/peticoes/pipeline/PED-2026-001");
    await expect(page.locator("text=Pipeline")).toBeVisible();
  });
});
