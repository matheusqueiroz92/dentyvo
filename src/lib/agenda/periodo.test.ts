import { afterEach, describe, expect, it, vi } from "vitest";

import { formatarHora, instanteSlot } from "./periodo";

describe("instanteSlot", () => {
  it("monta 10:00 America/Sao_Paulo corretamente (minutos do dia)", () => {
    const dia = new Date("2026-08-03T15:00:00.000Z");
    const slot = instanteSlot(dia, "10:00");
    // 10:00 BRT = 13:00 UTC
    expect(slot.toISOString()).toBe("2026-08-03T13:00:00.000Z");
  });
});

describe("formatarHora", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("formata ISO válido sem lançar", () => {
    expect(formatarHora("2026-08-03T13:00:00.000Z")).toMatch(/^\d{2}:\d{2}$/);
  });

  it("não derruba a UI com HH:mm ou valor inválido — retorna fallback e avisa", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    expect(formatarHora("07:00")).toBe("—");
    expect(formatarHora("")).toBe("—");
    expect(formatarHora("nao-e-data")).toBe("—");

    expect(warn).toHaveBeenCalled();
    expect(warn.mock.calls.some((c) => String(c[1]).includes("07:00"))).toBe(
      true,
    );
  });
});
