import { describe, expect, it, vi } from "vitest";

import {
  decidirAcaoLinkingSocial,
  processarLinkingSocialPorRisco,
} from "@/lib/auth-linking-risco";

describe("decidirAcaoLinkingSocial", () => {
  it("ataque: conta completa não verificada com senha credential → neutralizar", () => {
    expect(
      decidirAcaoLinkingSocial({
        providerId: "google",
        temClinicaOuPlataforma: true,
        emailVerificadoLocal: false,
        temSenhaCredential: true,
      }),
    ).toBe("neutralizar");
  });

  it("onboarding incompleto (sem clínica): linking permissivo mesmo sem e-mail verificado", () => {
    expect(
      decidirAcaoLinkingSocial({
        providerId: "google",
        temClinicaOuPlataforma: false,
        emailVerificadoLocal: false,
        temSenhaCredential: true,
      }),
    ).toBe("permitir");
  });

  it("conta completa com e-mail já verificado: linking normal (mantém senha)", () => {
    expect(
      decidirAcaoLinkingSocial({
        providerId: "google",
        temClinicaOuPlataforma: true,
        emailVerificadoLocal: true,
        temSenhaCredential: true,
      }),
    ).toBe("permitir");
  });

  it("criação de credential não dispara política de linking social", () => {
    expect(
      decidirAcaoLinkingSocial({
        providerId: "credential",
        temClinicaOuPlataforma: true,
        emailVerificadoLocal: false,
        temSenhaCredential: true,
      }),
    ).toBe("permitir");
  });

  it("conta completa sem senha credential (só OAuth): permitir", () => {
    expect(
      decidirAcaoLinkingSocial({
        providerId: "google",
        temClinicaOuPlataforma: true,
        emailVerificadoLocal: false,
        temSenhaCredential: false,
      }),
    ).toBe("permitir");
  });
});

describe("processarLinkingSocialPorRisco", () => {
  it("no cenário de takeover, revoga sessões e invalida senha antes do link", async () => {
    const revogarSessoes = vi.fn().mockResolvedValue(undefined);
    const invalidarSenhaCredential = vi.fn().mockResolvedValue(undefined);

    const acao = await processarLinkingSocialPorRisco(
      {
        usuarioId: "user-atacante",
        providerId: "google",
        temClinicaOuPlataforma: true,
        emailVerificadoLocal: false,
        temSenhaCredential: true,
      },
      { revogarSessoes, invalidarSenhaCredential },
    );

    expect(acao).toBe("neutralizar");
    expect(revogarSessoes).toHaveBeenCalledWith("user-atacante");
    expect(invalidarSenhaCredential).toHaveBeenCalledWith("user-atacante");
  });

  it("no onboarding incompleto, não revoga nem invalida senha", async () => {
    const revogarSessoes = vi.fn();
    const invalidarSenhaCredential = vi.fn();

    const acao = await processarLinkingSocialPorRisco(
      {
        usuarioId: "user-orfao",
        providerId: "google",
        temClinicaOuPlataforma: false,
        emailVerificadoLocal: false,
        temSenhaCredential: true,
      },
      { revogarSessoes, invalidarSenhaCredential },
    );

    expect(acao).toBe("permitir");
    expect(revogarSessoes).not.toHaveBeenCalled();
    expect(invalidarSenhaCredential).not.toHaveBeenCalled();
  });
});
