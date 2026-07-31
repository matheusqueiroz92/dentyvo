/**
 * @vitest-environment jsdom
 */
import { beforeEach, describe, expect, it } from "vitest";

import {
  RASCUNHO_CADASTRO_KEY,
  lerRascunhoCadastro,
  lerSenhaCadastroEmMemoria,
  limparRascunhoCadastro,
  salvarRascunhoCadastro,
  salvarSenhaCadastroEmMemoria,
} from "./rascunho";

describe("rascunho cadastro", () => {
  beforeEach(() => {
    limparRascunhoCadastro();
    sessionStorage.clear();
  });

  it("salva e lê rascunho sem senha no sessionStorage", () => {
    salvarSenhaCadastroEmMemoria("Segredo!123");
    salvarRascunhoCadastro({
      adminNome: "A",
      email: "a@b.com",
      planoId: "plano-basico",
    });

    expect(lerRascunhoCadastro()?.email).toBe("a@b.com");
    expect(lerSenhaCadastroEmMemoria()).toBe("Segredo!123");

    const raw = sessionStorage.getItem(RASCUNHO_CADASTRO_KEY);
    expect(raw).toBeTruthy();
    expect(raw).not.toContain("Segredo");
    expect(JSON.parse(raw!)).not.toHaveProperty("senha");

    limparRascunhoCadastro();
    expect(sessionStorage.getItem(RASCUNHO_CADASTRO_KEY)).toBeNull();
    expect(lerSenhaCadastroEmMemoria()).toBeNull();
  });

  it("remove chave legada v1 que podia conter senha", () => {
    sessionStorage.setItem(
      "dentyvo.cadastro.rascunho.v1",
      JSON.stringify({
        adminNome: "A",
        email: "a@b.com",
        senha: "vazada",
        planoId: "plano-basico",
      }),
    );
    expect(lerRascunhoCadastro()).toBeNull();
    expect(sessionStorage.getItem("dentyvo.cadastro.rascunho.v1")).toBeNull();
  });
});
