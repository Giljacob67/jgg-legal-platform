import { describe, it, expect } from "vitest";
import { validarNovoPedidoPayload, validarNovoPedidoSafe } from "@/modules/peticoes/domain/validarNovoPedidoPayload";
import type { NovoPedidoPayload } from "@/modules/peticoes/domain/types";

const validPayload: NovoPedidoPayload = {
  casoId: "CAS-2026-001",
  titulo: "Petição inicial com pedido liminar",
  tipoPeca: "Petição inicial",
  prioridade: "alta",
  prazoFinal: "2026-04-09",
};

describe("validarNovoPedidoPayload (throws)", () => {
  it("should not throw for valid payload", () => {
    expect(() => validarNovoPedidoPayload(validPayload)).not.toThrow();
  });

  it("should throw for empty casoId", () => {
    expect(() =>
      validarNovoPedidoPayload({ ...validPayload, casoId: "" }),
    ).toThrow("Informe um caso válido");
  });

  it("should throw for empty titulo", () => {
    expect(() =>
      validarNovoPedidoPayload({ ...validPayload, titulo: "   " }),
    ).toThrow("Informe um título");
  });

  it("should throw for empty prazoFinal", () => {
    expect(() =>
      validarNovoPedidoPayload({ ...validPayload, prazoFinal: "" }),
    ).toThrow("Informe um prazo final");
  });
});

describe("validarNovoPedidoSafe", () => {
  it("should return success for valid payload", () => {
    const result = validarNovoPedidoSafe(validPayload);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.casoId).toBe("CAS-2026-001");
    }
  });

  it("should return errors for invalid payload", () => {
    const result = validarNovoPedidoSafe({
      casoId: "",
      titulo: "",
      tipoPeca: "invalid",
      prioridade: "invalid",
      prazoFinal: "",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.length).toBeGreaterThan(0);
    }
  });

  it("should return errors for completely empty input", () => {
    const result = validarNovoPedidoSafe({});
    expect(result.success).toBe(false);
  });
});
