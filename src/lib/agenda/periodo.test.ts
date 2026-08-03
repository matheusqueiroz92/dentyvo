import { describe, expect, it } from "vitest";

import { instanteSlot } from "./periodo";

describe("instanteSlot", () => {
  it("monta 10:00 America/Sao_Paulo corretamente (minutos do dia)", () => {
    const dia = new Date("2026-08-03T15:00:00.000Z");
    const slot = instanteSlot(dia, "10:00");
    // 10:00 BRT = 13:00 UTC
    expect(slot.toISOString()).toBe("2026-08-03T13:00:00.000Z");
  });
});
