import { test, expect } from "@playwright/test";

const DEMO_EMAIL = process.env.E2E_LOGIN_EMAIL ?? "mariana@jgg.com.br";
const DEMO_PASSWORD = process.env.E2E_LOGIN_PASSWORD ?? "dev-only-change-me";

test.describe("Petições Flow", () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto("/login");
    await page.fill('input[type="email"]', DEMO_EMAIL);
    await page.fill('input[type="password"]', DEMO_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL("/dashboard", { timeout: 30000 });
  });

  test("should navigate to petições page and see existing pedidos", async ({ page }) => {
    await page.goto("/peticoes");
    await expect(page.locator("h1")).toContainText("Petições");
  });

  test("should navigate to novo pedido form", async ({ page }) => {
    await page.goto("/peticoes/novo");
    await expect(page.getByRole("heading", { level: 1, name: "Novo Pedido de Peça" })).toBeVisible();
  });

  test("should navigate to pipeline view of a pedido", async ({ page }) => {
    await page.goto("/peticoes/pipeline/PED-2026-001");
    await expect(page.getByRole("heading", { name: "Pipeline da Peça" })).toBeVisible();
  });
});
