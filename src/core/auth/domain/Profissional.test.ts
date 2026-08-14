import { describe, expect, it } from "vitest";

import {
  CroObrigatorioError,
  DadosInvalidosError,
  PerfilProprioNaoAutorizadoError,
  TenantMismatchError,
} from "./errors";
import { Profissional } from "./Profissional";

describe("Profissional", () => {
  it("permite admin e recepção sem CRO", () => {
    const admin = Profissional.criar({
      id: "p1",
      clinicaId: "c1",
      usuarioId: "u1",
      nome: "Ana",
      papel: "admin",
    });
    const recepcao = Profissional.criar({
      id: "p2",
      clinicaId: "c1",
      usuarioId: "u2",
      nome: "Bia",
      papel: "recepcao",
    });

    expect(admin.cro).toBeNull();
    expect(recepcao.cro).toBeNull();
  });

  it("exige CRO para dentista", () => {
    expect(() =>
      Profissional.criar({
        id: "p1",
        clinicaId: "c1",
        usuarioId: "u1",
        nome: "Dr. Carlos",
        papel: "dentista",
      }),
    ).toThrow(CroObrigatorioError);
  });

  it("cria dentista com CRO e slug derivado do nome", () => {
    const dentista = Profissional.criar({
      id: "p1",
      clinicaId: "c1",
      usuarioId: "u1",
      nome: "Dr. Carlos",
      papel: "dentista",
      cro: "12345",
      especialidade: "Endodontia",
    });

    expect(dentista.papel).toBe("dentista");
    expect(dentista.cro).toBe("12345");
    expect(dentista.slug).toBe("dr-carlos");
  });

  it("aceita slug explícito e permite atualizarSlug", () => {
    const dentista = Profissional.criar({
      id: "p1",
      clinicaId: "c1",
      usuarioId: "u1",
      nome: "Dr. Carlos",
      papel: "dentista",
      cro: "12345",
      slug: "carlos-endo",
    });
    expect(dentista.slug).toBe("carlos-endo");
    expect(dentista.atualizarSlug("dr-carlos-v2").slug).toBe("dr-carlos-v2");
  });

  it("rejeita nome vazio", () => {
    expect(() =>
      Profissional.criar({
        id: "p1",
        clinicaId: "c1",
        usuarioId: "u1",
        nome: "  ",
        papel: "admin",
      }),
    ).toThrow(DadosInvalidosError);
  });

  it("falha ao afirmar pertencimento a outra clínica", () => {
    const profissional = Profissional.criar({
      id: "p1",
      clinicaId: "c1",
      usuarioId: "u1",
      nome: "Ana",
      papel: "admin",
    });

    expect(() => profissional.assertPertenceAClinica("outra")).toThrow(
      TenantMismatchError,
    );
  });

  it("ao alterar papel para dentista exige CRO", () => {
    const recepcao = Profissional.criar({
      id: "p1",
      clinicaId: "c1",
      usuarioId: "u1",
      nome: "Bia",
      papel: "recepcao",
    });

    expect(() => recepcao.alterarPapel("dentista")).toThrow(CroObrigatorioError);
    expect(recepcao.alterarPapel("dentista", "999").papel).toBe("dentista");
  });

  describe("atualizarNome", () => {
    const dentista = () =>
      Profissional.criar({
        id: "p1",
        clinicaId: "c1",
        usuarioId: "u1",
        nome: "Dr. Carlos",
        papel: "dentista",
        cro: "12345",
        especialidade: "Endodontia",
        slug: "carlos-endo",
      });

    it("aplica trim e preserva CRO, papel, especialidade e slug", () => {
      const atualizado = dentista().atualizarNome("  Maria Silva  ");

      expect(atualizado.nome).toBe("Maria Silva");
      expect(atualizado.cro).toBe("12345");
      expect(atualizado.papel).toBe("dentista");
      expect(atualizado.especialidade).toBe("Endodontia");
      expect(atualizado.slug).toBe("carlos-endo");
      expect(atualizado.id).toBe("p1");
      expect(atualizado.clinicaId).toBe("c1");
      expect(atualizado.usuarioId).toBe("u1");
    });

    it("rejeita nome vazio ou só espaços", () => {
      const original = dentista();

      expect(() => original.atualizarNome("")).toThrow(DadosInvalidosError);
      expect(() => original.atualizarNome("   ")).toThrow(DadosInvalidosError);
      expect(original.nome).toBe("Dr. Carlos");
    });
  });

  describe("assertEhOProprioUsuario", () => {
    const profissional = () =>
      Profissional.criar({
        id: "p1",
        clinicaId: "c1",
        usuarioId: "u1",
        nome: "Ana",
        papel: "admin",
      });

    it("não lança quando o usuarioId é o dono da credencial", () => {
      expect(() => profissional().assertEhOProprioUsuario("u1")).not.toThrow();
    });

    it("rejeita tentativa de alterar perfil de outro usuário", () => {
      expect(() => profissional().assertEhOProprioUsuario("u-outro")).toThrow(
        PerfilProprioNaoAutorizadoError,
      );
    });
  });
});
