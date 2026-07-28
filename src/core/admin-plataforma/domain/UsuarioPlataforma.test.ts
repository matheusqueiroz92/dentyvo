import { describe, expect, it } from "vitest";

import { DadosInvalidosError } from "@/core/shared/errors";

import { UsuarioPlataforma } from "./UsuarioPlataforma";

describe("UsuarioPlataforma", () => {
  it("cria super-admin sem clinicaId", () => {
    const usuario = UsuarioPlataforma.criar({
      id: "plat-1",
      nome: " Dono ",
      email: "Dono@Dentyvo.COM",
    });

    expect(usuario.id).toBe("plat-1");
    expect(usuario.nome).toBe("Dono");
    expect(usuario.email).toBe("dono@dentyvo.com");
    expect(usuario.papel).toBe("super-admin");
    expect(
      Object.prototype.hasOwnProperty.call(usuario, "clinicaId"),
    ).toBe(false);
  });

  it("nunca aceita clinicaId preenchido", () => {
    expect(() =>
      UsuarioPlataforma.criar({
        id: "plat-1",
        nome: "Dono",
        email: "dono@dentyvo.com",
        clinicaId: "clinica-qualquer",
      }),
    ).toThrow(DadosInvalidosError);

    expect(() =>
      UsuarioPlataforma.criar({
        id: "plat-1",
        nome: "Dono",
        email: "dono@dentyvo.com",
        clinicaId: "  clinica-x  ",
      }),
    ).toThrow(/clinicaId/);
  });

  it("aceita clinicaId nulo ou vazio (ausência de vínculo)", () => {
    expect(() =>
      UsuarioPlataforma.criar({
        id: "plat-1",
        nome: "Dono",
        email: "dono@dentyvo.com",
        clinicaId: null,
      }),
    ).not.toThrow();

    expect(() =>
      UsuarioPlataforma.criar({
        id: "plat-2",
        nome: "Dono",
        email: "dono2@dentyvo.com",
        clinicaId: "",
      }),
    ).not.toThrow();
  });

  it("rejeita nome ou e-mail inválidos", () => {
    expect(() =>
      UsuarioPlataforma.criar({
        id: "plat-1",
        nome: "  ",
        email: "dono@dentyvo.com",
      }),
    ).toThrow(DadosInvalidosError);

    expect(() =>
      UsuarioPlataforma.criar({
        id: "plat-1",
        nome: "Dono",
        email: "sem-arroba",
      }),
    ).toThrow(DadosInvalidosError);
  });
});
