/**
 * @vitest-environment jsdom
 */
import { describe, expect, it } from "vitest";

import {
  RASCUNHO_CADASTRO_KEY,
  lerRascunhoCadastro,
  limparRascunhoCadastro,
  salvarRascunhoCadastro,
} from "./rascunho";

describe("rascunho cadastro", () => {
  it("salva e lê rascunho", () => {
    salvarRascunhoCadastro({
      adminNome: "A",
      email: "a@b.com",
      senha: "x",
      planoId: "plano-basico",
    });
    expect(lerRascunhoCadastro()?.email).toBe("a@b.com");
    limparRascunhoCadastro();
    expect(sessionStorage.getItem(RASCUNHO_CADASTRO_KEY)).toBeNull();
  });
});
