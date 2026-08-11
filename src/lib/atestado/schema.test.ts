import { describe, expect, it } from "vitest";

import { emitirAtestadoFormSchema } from "./schema";

describe("emitirAtestadoFormSchema", () => {
  const base = {
    motivo: "repouso pós-procedimento",
    cid: "K08.1",
    dataInicio: "2026-08-05",
    quantidadeDias: 5,
  };

  it("aceita CID válido e quantidade de dias >= 1", () => {
    expect(emitirAtestadoFormSchema.parse(base).cid).toBe("K08.1");
    expect(
      emitirAtestadoFormSchema.parse({ ...base, cid: "K081" }).cid,
    ).toBe("K081");
  });

  it("aceita CID ausente ou em branco (opcional)", () => {
    expect(
      emitirAtestadoFormSchema.parse({ ...base, cid: "" }).cid,
    ).toBeUndefined();
    expect(
      emitirAtestadoFormSchema.parse({
        motivo: base.motivo,
        dataInicio: base.dataInicio,
        quantidadeDias: base.quantidadeDias,
      }).cid,
    ).toBeUndefined();
  });

  it("rejeita CID em formato inválido antes de submeter", () => {
    expect(() =>
      emitirAtestadoFormSchema.parse({ ...base, cid: "08" }),
    ).toThrow();
    expect(() =>
      emitirAtestadoFormSchema.parse({ ...base, cid: "repouso" }),
    ).toThrow();
  });

  it("rejeita quantidadeDias menor que 1", () => {
    expect(() =>
      emitirAtestadoFormSchema.parse({ ...base, quantidadeDias: 0 }),
    ).toThrow();
  });

  it("exige motivo", () => {
    expect(() =>
      emitirAtestadoFormSchema.parse({ ...base, motivo: "  " }),
    ).toThrow();
  });
});
