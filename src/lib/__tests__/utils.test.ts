import { describe, it, expect } from "vitest";
import { cn, formatarData, formatarDataHora } from "@/lib/utils";

describe("cn (class names)", () => {
  it("should join truthy class names", () => {
    expect(cn("a", "b", "c")).toBe("a b c");
  });

  it("should filter out falsy values", () => {
    expect(cn("a", false, null, undefined, "b")).toBe("a b");
  });

  it("should return empty string for no truthy values", () => {
    expect(cn(false, null, undefined)).toBe("");
  });
});

describe("formatarData", () => {
  it("should format ISO datetime to pt-BR date", () => {
    const result = formatarData("2026-04-09T12:00:00-03:00");
    expect(result).toBe("09/04/2026");
  });

  it("should format ISO datetime to pt-BR date", () => {
    const result = formatarData("2026-03-30T09:00:00-03:00");
    expect(result).toMatch(/30\/03\/2026/);
  });
});

describe("formatarDataHora", () => {
  it("should format ISO datetime to pt-BR date and time", () => {
    const result = formatarDataHora("2026-04-01T14:30:00-03:00");
    expect(result).toMatch(/01\/04\/2026/);
    expect(result).toMatch(/14:30/);
  });
});
