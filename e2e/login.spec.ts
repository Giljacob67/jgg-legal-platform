import { test, expect } from "@playwright/test";

test.describe("Login Flow", () => {
  test("should show login page with brand and form", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { level: 1, name: "HUB JGG Group" })).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Senha")).toBeVisible();
  });

  test("should login with valid credentials and redirect to dashboard", async ({ page }) => {
    await page.goto("/login");

    await page.getByLabel("Email").fill("mariana@jgg.com.br");
    await page.getByLabel("Senha").fill("jgg2026");
    await page.getByRole("button", { name: "Entrar" }).click();

    await page.waitForURL("/dashboard", { timeout: 10000 });
    await expect(page).toHaveURL("/dashboard");
  });

  test("should show error for invalid credentials", async ({ page }) => {
    await page.goto("/login");

    await page.getByLabel("Email").fill("invalid@email.com");
    await page.getByLabel("Senha").fill("wrongpassword");
    await page.getByRole("button", { name: "Entrar" }).click();

    await expect(page.locator("text=Credenciais inválidas")).toBeVisible();
  });

  test("should redirect unauthenticated users to login", async ({ page }) => {
    await page.goto("/dashboard");
    // Should be redirected to login since not authenticated
    await expect(page).toHaveURL(/\/login/);
  });
});
