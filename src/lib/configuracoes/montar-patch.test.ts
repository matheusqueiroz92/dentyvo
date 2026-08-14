import { describe, expect, it } from "vitest";

import { montarPatchAtualizacaoClinica } from "./montar-patch";

const atual = { nome: "Clínica Um", endereco: "Rua A, 1" };

describe("montarPatchAtualizacaoClinica", () => {
  it("envia só o nome quando o endereço não mudou", () => {
    expect(
      montarPatchAtualizacaoClinica(
        { nome: " Clínica Renomeada ", endereco: "Rua A, 1" },
        atual,
      ),
    ).toEqual({ nome: "Clínica Renomeada" });
  });

  it("envia só o endereço quando o nome não mudou", () => {
    expect(
      montarPatchAtualizacaoClinica(
        { nome: "Clínica Um", endereco: " Av. Nova, 10 " },
        atual,
      ),
    ).toEqual({ endereco: "Av. Nova, 10" });
  });

  it("omite valor antigo reenviado sem alteração", () => {
    expect(
      montarPatchAtualizacaoClinica(
        { nome: "Clínica Um", endereco: "Rua A, 1" },
        atual,
      ),
    ).toBeNull();
  });

  it("envia os dois quando ambos mudaram", () => {
    expect(
      montarPatchAtualizacaoClinica(
        { nome: "Nova", endereco: "Outra rua" },
        atual,
      ),
    ).toEqual({ nome: "Nova", endereco: "Outra rua" });
  });
});
