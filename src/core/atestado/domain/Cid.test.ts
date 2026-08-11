import { describe, expect, it } from "vitest";

import { Cid } from "./Cid";
import { CidFormatoInvalidoError } from "./errors";

describe("Cid", () => {
  it.each(["K08.1", "K081", "A09", "K08"] as const)(
    "aceita formato CID-10 válido %s",
    (codigo) => {
      expect(Cid.criar(codigo).codigo).toBe(codigo);
    },
  );

  it("normaliza para maiúsculas e remove espaços nas pontas", () => {
    expect(Cid.criar("  k08.1  ").codigo).toBe("K08.1");
  });

  it.each(["08", "KK08", "K8", "repouso", "K08.11"] as const)(
    "rejeita formato claramente inválido %s",
    (codigo) => {
      expect(() => Cid.criar(codigo)).toThrow(CidFormatoInvalidoError);
    },
  );

  it("trata ausente, null e vazio como opcional (sem código)", () => {
    expect(Cid.parseOpcional(undefined)).toBeNull();
    expect(Cid.parseOpcional(null)).toBeNull();
    expect(Cid.parseOpcional("")).toBeNull();
    expect(Cid.parseOpcional("   ")).toBeNull();
  });

  it("valida formato quando o opcional vem preenchido", () => {
    expect(Cid.parseOpcional("K08.1")?.codigo).toBe("K08.1");
    expect(() => Cid.parseOpcional("K8")).toThrow(CidFormatoInvalidoError);
  });
});
