import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";

// rate-limit uses "server-only" which is a Next.js guard. Mock it to run in Vitest.
vi.mock("server-only", () => ({}));

const { verificarRateLimit, limparBucketsExpirados, _resetBuckets } = await import("@/lib/rate-limit");

describe("verificarRateLimit", () => {
  const userId = "user-test-123";
  const key = "test-action";

  beforeEach(() => {
    _resetBuckets();
  });

  afterEach(() => {
    _resetBuckets();
  });

  it("deve permitir a primeira chamada", () => {
    const result = verificarRateLimit(userId, key, 5);
    expect(result.permitido).toBe(true);
    expect(result.restante).toBe(4);
  });

  it("deve decrementar o contador a cada chamada", () => {
    verificarRateLimit(userId, key, 5);
    verificarRateLimit(userId, key, 5);
    const result = verificarRateLimit(userId, key, 5);
    expect(result.permitido).toBe(true);
    expect(result.restante).toBe(2);
  });

  it("deve bloquear quando o limite for atingido", () => {
    for (let i = 0; i < 3; i++) {
      verificarRateLimit(userId, key, 3);
    }
    const result = verificarRateLimit(userId, key, 3);
    expect(result.permitido).toBe(false);
    expect(result.restante).toBe(0);
    expect(result.resetEmMs).toBeGreaterThan(0);
  });

  it("deve usar buckets independentes por chave diferente", () => {
    for (let i = 0; i < 3; i++) {
      verificarRateLimit(userId, "chave-a", 3);
    }
    // chave-b ainda não foi usada
    const result = verificarRateLimit(userId, "chave-b", 3);
    expect(result.permitido).toBe(true);
  });

  it("deve usar buckets independentes por userId diferente", () => {
    for (let i = 0; i < 3; i++) {
      verificarRateLimit("usuario-a", key, 3);
    }
    // usuario-b ainda não foi usado
    const result = verificarRateLimit("usuario-b", key, 3);
    expect(result.permitido).toBe(true);
  });

  it("deve retornar resetEmMs positivo quando bloqueado", () => {
    for (let i = 0; i < 2; i++) {
      verificarRateLimit(userId, key, 2);
    }
    const result = verificarRateLimit(userId, key, 2);
    expect(result.permitido).toBe(false);
    expect(result.resetEmMs).toBeGreaterThan(0);
    expect(result.resetEmMs).toBeLessThanOrEqual(60 * 60 * 1000);
  });
});

describe("limparBucketsExpirados", () => {
  it("não deve lançar erro ao limpar buckets vazios", () => {
    expect(() => limparBucketsExpirados()).not.toThrow();
  });

  it("não deve lançar erro após inserir entradas", () => {
    verificarRateLimit("user-limpeza", "chave-limpeza", 5);
    expect(() => limparBucketsExpirados()).not.toThrow();
  });
});
