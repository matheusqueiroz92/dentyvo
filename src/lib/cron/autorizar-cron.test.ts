import { describe, expect, it } from "vitest";

import { cronAutorizado } from "./autorizar-cron";

const SECRET = "segredo-do-cron";

describe("cronAutorizado", () => {
  it("aceita o header Bearer com o segredo configurado", () => {
    expect(cronAutorizado(`Bearer ${SECRET}`, SECRET)).toBe(true);
  });

  it("rejeita segredo divergente", () => {
    expect(cronAutorizado("Bearer outro-segredo", SECRET)).toBe(false);
  });

  it("rejeita header ausente ou vazio", () => {
    expect(cronAutorizado(null, SECRET)).toBe(false);
    expect(cronAutorizado("", SECRET)).toBe(false);
    expect(cronAutorizado("   ", SECRET)).toBe(false);
  });

  it("rejeita header sem o esquema Bearer", () => {
    expect(cronAutorizado(SECRET, SECRET)).toBe(false);
    expect(cronAutorizado(`Basic ${SECRET}`, SECRET)).toBe(false);
  });

  it("rejeita quando o segredo do ambiente não está configurado", () => {
    expect(cronAutorizado("Bearer qualquer", "")).toBe(false);
    expect(cronAutorizado("Bearer ", "")).toBe(false);
    expect(cronAutorizado("Bearer undefined", undefined)).toBe(false);
  });

  it("rejeita prefixo parcial do segredo correto", () => {
    expect(cronAutorizado(`Bearer ${SECRET.slice(0, -1)}`, SECRET)).toBe(false);
    expect(cronAutorizado(`Bearer ${SECRET}x`, SECRET)).toBe(false);
  });
});
