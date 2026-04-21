import { describe, expect, it, vi } from "vitest";
import { criarEntradaRefAuditavel } from "@/modules/peticoes/application/operacional/observabilidade-pipeline";

vi.mock("server-only", () => ({}));

describe("observabilidade pipeline", () => {
  it("deve anexar trilha de auditoria no entradaRef", () => {
    const entrada = criarEntradaRefAuditavel(
      {
        origem: "ia_streaming",
        estagio: "triagem",
      },
      {
        requestId: "req-123",
        usuarioId: "usr-999",
        perfilUsuario: "advogado",
      },
    );

    expect(entrada).toMatchObject({
      origem: "ia_streaming",
      estagio: "triagem",
      requestId: "req-123",
      usuarioId: "usr-999",
      perfilUsuario: "advogado",
    });
  });
});
