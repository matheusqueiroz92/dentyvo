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

  describe("atualizarDadosCadastrais (emenda AtualizarClinica)", () => {
    const logoUrl = "https://blob.vercel-storage.com/clinicas/cli-1/logo.png";

    function clinicaComIdentidadeVisual() {
      return clinicaBase()
        .atualizarSlug("consultorio-silva-vc")
        .atualizarLogo(logoUrl)
        .atualizarTema("verde");
    }

    it("rejeita quando nome e endereço são omitidos", () => {
      const clinica = clinicaBase();
      expect(() => clinica.atualizarDadosCadastrais({})).toThrow(
        DadosInvalidosError,
      );
      expect(clinica.nome).toBe("Consultório Silva");
      expect(clinica.endereco).toBe("Rua A, 10");
    });

    it("atualiza só o nome e preserva o endereço existente", () => {
      const atualizada = clinicaBase().atualizarDadosCadastrais({
        nome: " Clínica Nova ",
      });
      expect(atualizada.nome).toBe("Clínica Nova");
      expect(atualizada.endereco).toBe("Rua A, 10");
    });

    it("atualiza só o endereço e preserva o nome existente", () => {
      const atualizada = clinicaBase().atualizarDadosCadastrais({
        endereco: " Av. B, 20 ",
      });
      expect(atualizada.nome).toBe("Consultório Silva");
      expect(atualizada.endereco).toBe("Av. B, 20");
    });

    it("rejeita string vazia de nome — não limpa o campo em silêncio", () => {
      const clinica = clinicaBase();
      expect(() => clinica.atualizarDadosCadastrais({ nome: "" })).toThrow(
        DadosInvalidosError,
      );
      expect(() => clinica.atualizarDadosCadastrais({ nome: "   " })).toThrow(
        DadosInvalidosError,
      );
      expect(clinica.nome).toBe("Consultório Silva");
    });

    it("rejeita string vazia de endereço — não limpa o campo em silêncio", () => {
      const clinica = clinicaBase();
      expect(() => clinica.atualizarDadosCadastrais({ endereco: "" })).toThrow(
        DadosInvalidosError,
      );
      expect(clinica.endereco).toBe("Rua A, 10");
    });

    it("não altera documento, status, slug, logo nem tema", () => {
      const clinica = clinicaComIdentidadeVisual();
      const atualizada = clinica.atualizarDadosCadastrais({
        nome: "Outro Nome",
        endereco: "Outra Rua",
      });

      expect(atualizada.documento.equals(documento)).toBe(true);
      expect(atualizada.status).toBe("ativa");
      expect(atualizada.slug).toBe("consultorio-silva-vc");
      expect(atualizada.logoUrl).toBe(logoUrl);
      expect(atualizada.tema).toBe("verde");
      expect(atualizada.id).toBe(clinica.id);
    });

    it("não reativa clínica inativa ao atualizar nome", () => {
      const atualizada = clinicaBase()
        .desativar()
        .atualizarDadosCadastrais({ nome: "Nome Inativa" });
      expect(atualizada.status).toBe("inativa");
      expect(atualizada.nome).toBe("Nome Inativa");
    });
  });
});
