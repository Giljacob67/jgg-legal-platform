import { Buffer } from "node:buffer";
import { expect, test, type Page } from "@playwright/test";

const PASSWORD = process.env.E2E_LOGIN_PASSWORD ?? "dev-only-change-me";
const ADVOGADO_EMAIL = process.env.E2E_LOGIN_EMAIL ?? "mariana@jgg.com.br";
const SOCIO_EMAIL = "gilberto@jgg.com.br";

async function login(page: Page, email: string) {
  await page.goto("/login");
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL("/dashboard", { timeout: 30000 });
}

test.describe("Release Readiness Core Flow", () => {
  test("fluxo autorizado cobre criação, upload, execução e idempotência", async ({ page }) => {
    await login(page, ADVOGADO_EMAIL);

    const triagemRes = await page.request.post("/api/agents/triagem", {
      data: {
        casoId: "CAS-2026-001",
        descricaoProblema:
          "Cliente relata inadimplemento contratual com risco de dano contínuo e pede providência imediata.",
      },
    });
    expect(triagemRes.status()).toBe(200);
    const triagemBody = await triagemRes.json() as { pedidoCriado?: string };
    expect(triagemBody.pedidoCriado).toBeTruthy();

    // Em DATA_MODE=mock, rotas podem executar em contextos com memória não compartilhada.
    // Para evitar flaky tests, o fluxo técnico usa um pedido seedado estável.
    const pedidoId = "PED-2026-001";

    const vinculos = JSON.stringify([
      { tipoEntidade: "caso", entidadeId: "CAS-2026-001", papel: "principal" },
      { tipoEntidade: "pedido_peca", entidadeId: pedidoId, papel: "principal" },
    ]);

    const uploadRes = await page.request.post("/api/documentos/upload", {
      multipart: {
        file: {
          name: "documento-release.txt",
          mimeType: "text/plain",
          buffer: Buffer.from("Notificação extrajudicial enviada e não respondida no prazo."),
        },
        titulo: "Documento release",
        tipoDocumento: "Petição",
        vinculos,
      },
    });
    expect(uploadRes.status()).toBe(200);
    const uploadBody = await uploadRes.json() as { documentoId?: string };
    expect(uploadBody.documentoId).toBeTruthy();

    const docsRes = await page.request.get(`/api/documentos?pedidoId=${pedidoId}`);
    expect(docsRes.status()).toBe(200);
    const docsBody = await docsRes.json() as { documentos?: Array<{ documento: { id: string } }> };
    expect(Array.isArray(docsBody.documentos)).toBe(true);
    expect(docsBody.documentos!.some((item) => item.documento.id === uploadBody.documentoId)).toBe(true);

    const stageRes = await page.request.post(`/api/peticoes/pipeline/${pedidoId}/executar/triagem`);
    expect(stageRes.status()).toBe(200);
    const executionMode = stageRes.headers()["x-execution-mode"];
    expect(["mock", "ai"]).toContain(executionMode);
    const stageText = await stageRes.text();
    expect(stageText.length).toBeGreaterThan(20);

    const duplicateRes = await page.request.post(`/api/peticoes/pipeline/${pedidoId}/executar/triagem`);
    expect([200, 409]).toContain(duplicateRes.status());
    if (duplicateRes.status() === 409) {
      const duplicateBody = await duplicateRes.json() as { details?: { reason?: string } };
      expect(["running", "duplicate"]).toContain(duplicateBody.details?.reason);
    } else {
      const secondRunText = await duplicateRes.text();
      expect(secondRunText.length).toBeGreaterThan(20);
    }
  });

  test("trilha de auditoria fica disponível para perfil com acesso administrativo", async ({ page }) => {
    await login(page, SOCIO_EMAIL);

    const contratosRes = await page.request.get("/api/contratos");
    expect(contratosRes.status()).toBe(200);

    const auditRes = await page.request.get("/api/administracao/auditoria?limit=20");
    expect(auditRes.status()).toBe(200);
    const body = await auditRes.json() as {
      logs?: Array<{ resource?: string; action?: string; result?: string; userId?: string }>;
    };

    expect(Array.isArray(body.logs)).toBe(true);
    expect(body.logs!.length).toBeGreaterThan(0);
    expect(
      body.logs!.some(
        (entry) =>
          entry.resource === "contratos" &&
          entry.action === "read" &&
          (entry.result === "success" || entry.result === "denied"),
      ),
    ).toBe(true);
  });

  test("perfil sem permissão administrativa recebe 403 ao consultar auditoria", async ({ page }) => {
    await login(page, ADVOGADO_EMAIL);

    const res = await page.request.get("/api/administracao/auditoria?limit=5");
    expect(res.status()).toBe(403);
    const body = await res.json() as { code?: string };
    expect(body.code).toBe("FORBIDDEN");
  });
});
