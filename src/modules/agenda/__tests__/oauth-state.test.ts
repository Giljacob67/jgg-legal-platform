import { describe, expect, it } from "vitest";
import { criarOAuthState, validarOAuthState } from "@/modules/agenda/infrastructure/oauth-state.server";

describe("oauth-state", () => {
  it("cria e valida state assinado", () => {
    const state = criarOAuthState({
      userId: "usr-123",
      redirectTo: "/agenda",
    });

    const payload = validarOAuthState(state);

    expect(payload).not.toBeNull();
    expect(payload?.userId).toBe("usr-123");
    expect(payload?.redirectTo).toBe("/agenda");
  });

  it("rejeita state adulterado", () => {
    const state = criarOAuthState({
      userId: "usr-123",
      redirectTo: "/agenda",
    });

    const adulterado = `${state}x`;

    expect(validarOAuthState(adulterado)).toBeNull();
  });
});
