import { describe, expect, it } from "vitest";

import {
  formatarDocumentoFiscal,
  rotuloTipoDocumento,
} from "./formatar-documento";

describe("formatarDocumentoFiscal", () => {
  it("formata CPF", () => {
    expect(formatarDocumentoFiscal("cpf", "39053344705")).toBe("390.533.447-05");
  });

  it("formata CNPJ", () => {
    expect(formatarDocumentoFiscal("cnpj", "11222333000181")).toBe(
      "11.222.333/0001-81",
    );
  });

  it("rotula o tipo", () => {
    expect(rotuloTipoDocumento("cpf")).toBe("CPF");
    expect(rotuloTipoDocumento("cnpj")).toBe("CNPJ");
  });
});
