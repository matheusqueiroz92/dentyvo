import { describe, expect, it } from "vitest";

import { CONVITE_TTL_MS } from "./constants";
import { Convite } from "./Convite";
import {
  ConviteExpiradoError,
  ConviteJaAceitoError,
  DadosInvalidosError,
} from "./errors";

describe("Convite", () => {
  const agora = new Date("2026-07-01T12:00:00.000Z");

  it("define expiração em 72 horas a partir da criação", () => {
    const convite = Convite.criar({
      id: "cv-1",
      clinicaId: "c1",
      email: "Dentista@Email.com",
      papel: "dentista",
      token: "token-1",
      convidadoPorUsuarioId: "u-admin",
      agora,
    });

    expect(convite.email).toBe("dentista@email.com");
    expect(convite.expiresAt.getTime()).toBe(agora.getTime() + CONVITE_TTL_MS);
    expect(convite.estaPendente()).toBe(true);
    expect(convite.estaExpirado(agora)).toBe(false);
  });

  it("rejeita e-mail inválido", () => {
    expect(() =>
      Convite.criar({
        id: "cv-1",
        clinicaId: "c1",
        email: "sem-arroba",
        papel: "recepcao",
        token: "t",
        convidadoPorUsuarioId: "u-admin",
        agora,
      }),
    ).toThrow(DadosInvalidosError);
  });

  it("não permite aceitar convite após 72 horas", () => {
    const convite = Convite.criar({
      id: "cv-1",
      clinicaId: "c1",
      email: "novo@email.com",
      papel: "admin",
      token: "token-1",
      convidadoPorUsuarioId: "u-admin",
      agora,
    });

    const depoisDe72h = new Date(agora.getTime() + CONVITE_TTL_MS);

    expect(convite.estaExpirado(depoisDe72h)).toBe(true);
    expect(() => convite.assertPodeAceitar(depoisDe72h)).toThrow(
      ConviteExpiradoError,
    );
    expect(() => convite.aceitar(depoisDe72h)).toThrow(ConviteExpiradoError);
  });

  it("permite aceitar dentro da janela de 72 horas e marca como usado", () => {
    const convite = Convite.criar({
      id: "cv-1",
      clinicaId: "c1",
      email: "novo@email.com",
      papel: "recepcao",
      token: "token-1",
      convidadoPorUsuarioId: "u-admin",
      agora,
    });

    const dentroDaJanela = new Date(agora.getTime() + CONVITE_TTL_MS - 1);
    const aceito = convite.aceitar(dentroDaJanela);

    expect(aceito.aceitoEm).toEqual(dentroDaJanela);
    expect(aceito.estaPendente()).toBe(false);
    expect(() => aceito.aceitar(dentroDaJanela)).toThrow(ConviteJaAceitoError);
  });
});
