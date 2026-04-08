import { describe, expect, it, vi, beforeEach } from "vitest";
import { getMockUsers } from "@/lib/mock-users";

describe("getMockUsers", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  it("usa fallback quando MOCK_USERS_JSON é inválido", () => {
    vi.stubEnv("MOCK_USERS_JSON", "not-json");
    vi.stubEnv("MOCK_DEFAULT_PASSWORD", "senha-teste");

    const users = getMockUsers();
    expect(users.length).toBeGreaterThan(0);
    expect(users.every((user) => user.password === "senha-teste")).toBe(true);
  });

  it("prioriza MOCK_USERS_JSON quando válido", () => {
    vi.stubEnv(
      "MOCK_USERS_JSON",
      JSON.stringify([
        {
          id: "usr-001",
          email: "teste@jgg.com.br",
          password: "abc",
          name: "Teste",
          initials: "TS",
          role: "advogado",
        },
      ]),
    );

    const users = getMockUsers();
    expect(users).toHaveLength(1);
    expect(users[0].email).toBe("teste@jgg.com.br");
    expect(users[0].password).toBe("abc");
  });
});
