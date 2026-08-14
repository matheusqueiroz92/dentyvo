import { describe, expect, it } from "vitest";

import { abaDetalhePacienteDaQuery } from "./aba";

describe("abaDetalhePacienteDaQuery", () => {
  it("abre a aba Prontuário quando a query pede", () => {
    expect(abaDetalhePacienteDaQuery("prontuario")).toBe("prontuario");
  });

  it("abre Histórico quando a query pede", () => {
    expect(abaDetalhePacienteDaQuery("historico")).toBe("historico");
  });

  it("cai em Dados gerais para query ausente ou inválida", () => {
    expect(abaDetalhePacienteDaQuery(null)).toBe("dados");
    expect(abaDetalhePacienteDaQuery("")).toBe("dados");
    expect(abaDetalhePacienteDaQuery("financeiro")).toBe("dados");
  });
});
