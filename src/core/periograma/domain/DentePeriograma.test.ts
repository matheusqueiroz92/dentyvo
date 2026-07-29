import { describe, expect, it } from "vitest";

import { NumeroDenteInvalidoError } from "@/core/odontograma/domain/errors";
import { DadosInvalidosError } from "@/core/shared/errors";

import { DentePeriograma } from "./DentePeriograma";
import {
  FurcaNaoAplicavelAoDenteError,
  MobilidadeMillerInvalidaError,
  PontosSondagemExcedentesError,
  PontoSondagemDuplicadoError,
} from "./errors";

describe("DentePeriograma", () => {
  it("aceita furca Hamp em molar permanente (16)", () => {
    const dente = DentePeriograma.criar({
      numeroDente: 16,
      classificacaoFurca: { sistema: "hamp", grau: 1 },
    });

    expect(dente.numeroDenteValor).toBe(16);
    expect(dente.classificacaoFurca?.sistema).toBe("hamp");
    expect(dente.classificacaoFurca?.grau).toBe(1);
  });

  it("aceita furca Glickman em molar decíduo (54)", () => {
    const dente = DentePeriograma.criar({
      numeroDente: 54,
      classificacaoFurca: { sistema: "glickman", grau: 3 },
    });

    expect(dente.numeroDenteValor).toBe(54);
    expect(dente.classificacaoFurca?.sistema).toBe("glickman");
    expect(dente.classificacaoFurca?.grau).toBe(3);
  });

  it("rejeita furca em dente não-molar (incisivo 11)", () => {
    expect(() =>
      DentePeriograma.criar({
        numeroDente: 11,
        classificacaoFurca: { sistema: "hamp", grau: 1 },
      }),
    ).toThrow(FurcaNaoAplicavelAoDenteError);
  });

  it("permite classificacaoFurca null em dente não-molar", () => {
    const dente = DentePeriograma.criar({
      numeroDente: 21,
      classificacaoFurca: null,
      mobilidade: 0,
    });

    expect(dente.classificacaoFurca).toBeNull();
    expect(dente.mobilidade).toBe(0);
  });

  it.each([0, 1, 2, 3] as const)(
    "aceita mobilidade Miller grau %s",
    (grau) => {
      const dente = DentePeriograma.criar({
        numeroDente: 36,
        mobilidade: grau,
      });
      expect(dente.mobilidade).toBe(grau);
    },
  );

  it.each([-1, 4] as const)(
    "rejeita mobilidade Miller fora de 0–3 (%s)",
    (grau) => {
      expect(() =>
        DentePeriograma.criar({ numeroDente: 36, mobilidade: grau }),
      ).toThrow(MobilidadeMillerInvalidaError);
    },
  );

  it("aceita até 6 pontos sem exigir todos preenchidos", () => {
    const dente = DentePeriograma.criar({
      numeroDente: 26,
      pontos: [
        { lado: "vestibular", posicao: "mesial", profundidadeSondagem: 3 },
        { lado: "vestibular", posicao: "central" },
      ],
    });

    expect(dente.pontos).toHaveLength(2);
  });

  it("rejeita mais de 6 pontos", () => {
    expect(() =>
      DentePeriograma.criar({
        numeroDente: 26,
        pontos: [
          { lado: "vestibular", posicao: "mesial" },
          { lado: "vestibular", posicao: "central" },
          { lado: "vestibular", posicao: "distal" },
          { lado: "palatina_lingual", posicao: "mesial" },
          { lado: "palatina_lingual", posicao: "central" },
          { lado: "palatina_lingual", posicao: "distal" },
          { lado: "vestibular", posicao: "mesial" },
        ],
      }),
    ).toThrow(PontosSondagemExcedentesError);
  });

  it("rejeita ponto duplicado (mesmo lado + posição)", () => {
    expect(() =>
      DentePeriograma.criar({
        numeroDente: 26,
        pontos: [
          { lado: "vestibular", posicao: "mesial" },
          { lado: "vestibular", posicao: "mesial", placa: true },
        ],
      }),
    ).toThrow(PontoSondagemDuplicadoError);
  });

  it("rejeita numeroDente fora das faixas FDI da 004", () => {
    expect(() => DentePeriograma.criar({ numeroDente: 19 })).toThrow(
      NumeroDenteInvalidoError,
    );
  });

  it("aceita implante true/false e null (não avaliado)", () => {
    expect(
      DentePeriograma.criar({ numeroDente: 11, implante: true }).implante,
    ).toBe(true);
    expect(
      DentePeriograma.criar({ numeroDente: 11, implante: false }).implante,
    ).toBe(false);
    expect(
      DentePeriograma.criar({ numeroDente: 11, implante: null }).implante,
    ).toBeNull();
  });

  it("rejeita implante não booleano", () => {
    expect(() =>
      DentePeriograma.criar({
        numeroDente: 11,
        implante: "sim" as unknown as boolean,
      }),
    ).toThrow(DadosInvalidosError);
  });

  it("persiste nota e normaliza texto vazio para null", () => {
    expect(
      DentePeriograma.criar({
        numeroDente: 16,
        nota: "  Sangramento residual  ",
      }).nota,
    ).toBe("Sangramento residual");
    expect(
      DentePeriograma.criar({ numeroDente: 16, nota: "   " }).nota,
    ).toBeNull();
    expect(DentePeriograma.criar({ numeroDente: 16, nota: null }).nota).toBeNull();
  });
});
