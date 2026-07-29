import { describe, expect, it } from "vitest";

import { DadosInvalidosError } from "@/core/shared/errors";

import {
  LadoSondagemInvalidoError,
  PosicaoSondagemInvalidaError,
} from "./errors";
import { PontoSondagem } from "./PontoSondagem";

describe("PontoSondagem", () => {
  it("aceita margemGengival negativa (recessão)", () => {
    const ponto = PontoSondagem.criar({
      lado: "vestibular",
      posicao: "mesial",
      margemGengival: -2,
      profundidadeSondagem: 5,
      placa: false,
      sangramentoSondagem: true,
    });

    expect(ponto.margemGengival).toBe(-2);
    expect(ponto.profundidadeSondagem).toBe(5);
    expect(ponto.placa).toBe(false);
    expect(ponto.sangramentoSondagem).toBe(true);
  });

  it("permite preenchimento parcial (medições opcionais)", () => {
    const ponto = PontoSondagem.criar({
      lado: "palatina_lingual",
      posicao: "distal",
    });

    expect(ponto.margemGengival).toBeNull();
    expect(ponto.profundidadeSondagem).toBeNull();
    expect(ponto.placa).toBeNull();
    expect(ponto.sangramentoSondagem).toBeNull();
  });

  it("rejeita profundidadeSondagem negativa", () => {
    expect(() =>
      PontoSondagem.criar({
        lado: "vestibular",
        posicao: "central",
        profundidadeSondagem: -1,
      }),
    ).toThrow(DadosInvalidosError);
  });

  it("rejeita lado inválido", () => {
    expect(() =>
      PontoSondagem.criar({ lado: "oclusal", posicao: "mesial" }),
    ).toThrow(LadoSondagemInvalidoError);
  });

  it("rejeita posição inválida", () => {
    expect(() =>
      PontoSondagem.criar({ lado: "vestibular", posicao: "média" }),
    ).toThrow(PosicaoSondagemInvalidaError);
  });
});
