import { test, expect } from "@playwright/test";

const DEMO_EMAIL = process.env.E2E_LOGIN_EMAIL ?? "mariana@jgg.com.br";
const DEMO_PASSWORD = process.env.E2E_LOGIN_PASSWORD ?? "dev-only-change-me";

test.describe("Login Flow", () => {
  test("should show login page with demo credentials", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("h1")).toContainText("HUB JGG Group");
    await expect(page.locator("text=Credenciais de demonstração")).toBeVisible();
  });

  test("should login with valid credentials and redirect to dashboard", async ({ page }) => {
    await page.goto("/login");

    await page.fill('input[type="email"]', DEMO_EMAIL);
    await page.fill('input[type="password"]', DEMO_PASSWORD);
    await page.click('button[type="submit"]');

    await page.waitForURL("/dashboard", { timeout: 10000 });
    await expect(page).toHaveURL("/dashboard");
  });

  test("should show error for invalid credentials", async ({ page }) => {
    await page.goto("/login");

    await page.fill('input[type="email"]', "invalid@email.com");
    await page.fill('input[type="password"]', "wrongpassword");
    await page.click('button[type="submit"]');

    await expect(page.locator("text=Credenciais inválidas")).toBeVisible();
  });

  test("should redirect unauthenticated users to login", async ({ page }) => {
    await page.goto("/dashboard");
    // Should be redirected to login since not authenticated
    await expect(page).toHaveURL(/\/login/);
  });
});
