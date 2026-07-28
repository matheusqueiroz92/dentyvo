import { describe, expect, it } from "vitest";

import { CONVITE_TTL_MS, SESSAO_TTL_MS } from "./constants";

describe("TTLs da feature 001", () => {
  it("define TTL de convite em 72 horas", () => {
    expect(CONVITE_TTL_MS).toBe(72 * 60 * 60 * 1000);
  });

  it("define TTL de sessão em 7 dias", () => {
    expect(SESSAO_TTL_MS).toBe(7 * 24 * 60 * 60 * 1000);
  });
});
