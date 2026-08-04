import { describe, expect, it } from "vitest";

import { Clinica } from "./Clinica";
import { DocumentoFiscal } from "./DocumentoFiscal";
import { DadosInvalidosError } from "./errors";
import { TEMAS_CLINICA } from "./TemaClinica";

describe("Clinica", () => {
  const documento = DocumentoFiscal.criar("cpf", "39053344705");

  function clinicaBase() {
    return Clinica.criar({
      id: "cli-1",
      nome: "Consultório Silva",
      endereco: "Rua A, 10",
      documento,
    });
  }

  it("cria clínica com status inicial ativa e slug derivado do nome", () => {
    const clinica = Clinica.criar({
      id: "cli-1",
      nome: " Consultório Silva ",
      endereco: " Rua A, 10 ",
      documento,
    });

    expect(clinica.status).toBe("ativa");
    expect(clinica.nome).toBe("Consultório Silva");
    expect(clinica.endereco).toBe("Rua A, 10");
    expect(clinica.documento.equals(documento)).toBe(true);
    expect(clinica.slug).toBe("consultorio-silva");
    expect(clinica.logoUrl).toBeNull();
    expect(clinica.tema).toBeNull();
  });

  it("aceita slug explícito e permite atualizarSlug", () => {
    const clinica = Clinica.criar({
      id: "cli-1",
      nome: "Consultório Silva",
      endereco: "Rua A, 10",
      documento,
      slug: "sorriso-vc",
    });
    expect(clinica.slug).toBe("sorriso-vc");
    expect(clinica.atualizarSlug("nova-clinica").slug).toBe("nova-clinica");
  });

  it("rejeita nome vazio", () => {
    expect(() =>
      Clinica.criar({
        id: "cli-1",
        nome: "   ",
        endereco: "Rua A",
        documento,
      }),
    ).toThrow(DadosInvalidosError);
  });

  it("rejeita endereço vazio", () => {
    expect(() =>
      Clinica.criar({
        id: "cli-1",
        nome: "Clínica",
        endereco: " ",
        documento,
      }),
    ).toThrow(DadosInvalidosError);
  });

  describe("logoUrl e tema", () => {
    it.each(TEMAS_CLINICA)("aceita tema pré-definido %s", (tema) => {
      const atualizada = clinicaBase().atualizarTema(tema);
      expect(atualizada.tema).toBe(tema);
    });

    it("rejeita tema fora do enum com erro de domínio", () => {
      expect(() => clinicaBase().atualizarTema("neon-cyber")).toThrow(
        DadosInvalidosError,
      );
    });

    it("aceita tema null (volta ao padrão da UI)", () => {
      const comTema = clinicaBase().atualizarTema("verde");
      const semTema = comTema.atualizarTema(null);
      expect(semTema.tema).toBeNull();
    });

    it("aceita logoUrl string válida", () => {
      const url = "https://blob.vercel-storage.com/clinicas/cli-1/logo.png";
      const atualizada = clinicaBase().atualizarLogo(url);
      expect(atualizada.logoUrl).toBe(url);
    });

    it("aceita logoUrl null (remove logo customizado)", () => {
      const comLogo = clinicaBase().atualizarLogo(
        "https://blob.vercel-storage.com/logo.png",
      );
      const semLogo = comLogo.atualizarLogo(null);
      expect(semLogo.logoUrl).toBeNull();
    });

    it("rejeita logoUrl vazio (só espaços)", () => {
      expect(() => clinicaBase().atualizarLogo("   ")).toThrow(
        DadosInvalidosError,
      );
    });
  });
});
