import { describe, expect, it } from "vitest";

import { DadosInvalidosError, TenantMismatchError } from "@/core/shared/errors";

import {
  Assinatura,
  adicionarDiasCorridos,
} from "./Assinatura";
import {
  chaveNegocioAvisoAumentoPreco,
  jaEnviouAvisoAumentoPreco,
  assinaturaPendenteDeAvisoAumentoPreco,
} from "./avisoAumentoPreco";
import {
  ANTECEDENCIA_AVISO_AUMENTO_PRECO_DIAS,
  DURACAO_PROMOCAO_LANCAMENTO_MESES,
  LIMITE_VAGAS_PROMOCIONAIS_LANCAMENTO,
  PRECO_PROMOCIONAL_CENTAVOS,
} from "./constants";
import {
  planoElegivelParaPromocao,
  precoPromocionalCentavosParaPlano,
  resolverCodigoPlanoPromocional,
  valorMensalPlanoEmCentavos,
} from "./elegibilidadePromocional";
import { CopiaPromocionalDivergenteError } from "./errors";
import { assinaturaPendenteDeMigracaoPrecoCheio } from "./migracaoPrecoPosPromocao";
import { Plano } from "./Plano";
import {
  VagaPromocional,
  adicionarMesesCorridos,
} from "./VagaPromocional";

const INICIO = new Date("2026-07-01T12:00:00.000Z");

function trial() {
  return Assinatura.iniciarTrial({
    id: "ass-1",
    clinicaId: "clinica-1",
    dataInicio: INICIO,
  });
}

function vagaPara(assinatura: Assinatura, posicao = 1) {
  return VagaPromocional.criar({
    posicao,
    clinicaId: assinatura.clinicaId,
    assinaturaId: assinatura.id,
    reservadaEm: INICIO,
  });
}

function comCopiaPromocional(assinatura: Assinatura = trial()) {
  return assinatura.aplicarCopiaPromocionalDaVaga({
    vaga: vagaPara(assinatura),
    precoPromocionalCentavos: PRECO_PROMOCIONAL_CENTAVOS.basico,
  });
}

describe("VagaPromocional (domínio — spec 012)", () => {
  it("aceita posição entre 1 e 30 e calcula precoPromocionalAte = reservadaEm + 12 meses", () => {
    const vaga = VagaPromocional.criar({
      posicao: 1,
      clinicaId: "clinica-1",
      assinaturaId: "ass-1",
      reservadaEm: INICIO,
    });

    expect(vaga.posicao).toBe(1);
    expect(LIMITE_VAGAS_PROMOCIONAIS_LANCAMENTO).toBe(30);
    expect(DURACAO_PROMOCAO_LANCAMENTO_MESES).toBe(12);
    expect(vaga.calcularPrecoPromocionalAte()).toEqual(
      adicionarMesesCorridos(INICIO, 12),
    );
  });

  it("rejeita posição fora de 1..30", () => {
    expect(() =>
      VagaPromocional.criar({
        posicao: 0,
        clinicaId: "c1",
        assinaturaId: "a1",
        reservadaEm: INICIO,
      }),
    ).toThrow(DadosInvalidosError);

    expect(() =>
      VagaPromocional.criar({
        posicao: 31,
        clinicaId: "c1",
        assinaturaId: "a1",
        reservadaEm: INICIO,
      }),
    ).toThrow(DadosInvalidosError);
  });
});

describe("elegibilidade promocional (spec 012, D2)", () => {
  it("Básico e Médio são elegíveis com preços 5900 e 9900 centavos", () => {
    const basico = Plano.criar({ id: "plano-basico", nome: "Básico", valorMensal: 99.9 });
    const medio = Plano.criar({ id: "plano-medio", nome: "Médio", valorMensal: 159 });

    expect(resolverCodigoPlanoPromocional(basico)).toBe("basico");
    expect(resolverCodigoPlanoPromocional(medio)).toBe("medio");
    expect(precoPromocionalCentavosParaPlano(basico)).toBe(5900);
    expect(precoPromocionalCentavosParaPlano(medio)).toBe(9900);
    expect(planoElegivelParaPromocao(basico)).toBe(true);
  });

  it("Full não é elegível e não consome preço promocional", () => {
    const full = Plano.criar({ id: "plano-full", nome: "Full", valorMensal: 279 });

    expect(resolverCodigoPlanoPromocional(full)).toBeNull();
    expect(precoPromocionalCentavosParaPlano(full)).toBeNull();
    expect(planoElegivelParaPromocao(full)).toBe(false);
  });

  it("converte valorMensal do plano para centavos", () => {
    const plano = Plano.criar({ id: "p", nome: "Básico", valorMensal: 99.9 });
    expect(valorMensalPlanoEmCentavos(plano)).toBe(9990);
  });
});

describe("Assinatura — cópia promocional da vaga (spec 012, D6)", () => {
  it("aplicarCopiaPromocionalDaVaga grava centavos e data fim a partir da vaga", () => {
    const assinatura = trial();
    const vaga = vagaPara(assinatura);
    const comPromo = assinatura.aplicarCopiaPromocionalDaVaga({
      vaga,
      precoPromocionalCentavos: PRECO_PROMOCIONAL_CENTAVOS.basico,
    });

    expect(comPromo.precoPromocionalCentavos).toBe(5900);
    expect(comPromo.precoPromocionalAte).toEqual(vaga.calcularPrecoPromocionalAte());
    expect(comPromo.temPrecoPromocionalAtivo(INICIO)).toBe(true);
    expect(
      comPromo.temPrecoPromocionalAtivo(
        adicionarMesesCorridos(INICIO, 12),
      ),
    ).toBe(false);
  });

  it("rejeita vaga de outra assinatura ou clínica", () => {
    const assinatura = trial();
    expect(() =>
      assinatura.aplicarCopiaPromocionalDaVaga({
        vaga: VagaPromocional.criar({
          posicao: 1,
          clinicaId: "outra",
          assinaturaId: assinatura.id,
          reservadaEm: INICIO,
        }),
        precoPromocionalCentavos: 5900,
      }),
    ).toThrow(TenantMismatchError);

    expect(() =>
      assinatura.aplicarCopiaPromocionalDaVaga({
        vaga: VagaPromocional.criar({
          posicao: 1,
          clinicaId: assinatura.clinicaId,
          assinaturaId: "outra-ass",
          reservadaEm: INICIO,
        }),
        precoPromocionalCentavos: 5900,
      }),
    ).toThrow(DadosInvalidosError);
  });

  it("é idempotente com a mesma cópia e rejeita divergência (não edita à mão)", () => {
    const primeira = comCopiaPromocional();
    const vaga = vagaPara(primeira);
    const deNovo = primeira.aplicarCopiaPromocionalDaVaga({
      vaga,
      precoPromocionalCentavos: PRECO_PROMOCIONAL_CENTAVOS.basico,
    });
    expect(deNovo).toBe(primeira);

    expect(() =>
      primeira.aplicarCopiaPromocionalDaVaga({
        vaga,
        precoPromocionalCentavos: PRECO_PROMOCIONAL_CENTAVOS.medio,
      }),
    ).toThrow(CopiaPromocionalDivergenteError);
  });
});

describe("Assinatura — aviso de aumento de preço (spec 012, D7)", () => {
  it("chaveNegocio segue aviso_aumento_preco:{assinaturaId}:{yyyy-MM-dd}", () => {
    const ate = new Date("2027-07-01T12:00:00.000Z");
    expect(chaveNegocioAvisoAumentoPreco("ass-1", ate)).toBe(
      "aviso_aumento_preco:ass-1:2027-07-01",
    );
  });

  it("marcarAvisoAumentoPrecoEnviado preenche o flag; já enviado é idempotente", () => {
    const comPromo = comCopiaPromocional();
    expect(jaEnviouAvisoAumentoPreco(comPromo)).toBe(false);

    const marcada = comPromo.marcarAvisoAumentoPrecoEnviado(INICIO);
    expect(marcada.avisoAumentoPrecoEnviadoEm).toEqual(INICIO);
    expect(jaEnviouAvisoAumentoPreco(marcada)).toBe(true);
    expect(marcada.marcarAvisoAumentoPrecoEnviado(INICIO)).toBe(marcada);
  });

  it("assinatura fica pendente de aviso só na janela de 30 dias antes do fim", () => {
    const comPromo = comCopiaPromocional();
    const ate = comPromo.precoPromocionalAte!;
    const inicioJanela = adicionarDiasCorridos(
      ate,
      -ANTECEDENCIA_AVISO_AUMENTO_PRECO_DIAS,
    );

    expect(assinaturaPendenteDeAvisoAumentoPreco(comPromo, INICIO)).toBe(false);
    expect(
      assinaturaPendenteDeAvisoAumentoPreco(comPromo, inicioJanela),
    ).toBe(true);

    const avisada = comPromo.marcarAvisoAumentoPrecoEnviado(inicioJanela);
    expect(
      assinaturaPendenteDeAvisoAumentoPreco(avisada, inicioJanela),
    ).toBe(false);
  });
});

describe("Assinatura — migração para preço cheio (spec 012)", () => {
  it("marcarMigradaParaPrecoCheio preenche o flag e jaMigradaParaPrecoCheio", () => {
    const comPromo = comCopiaPromocional();
    expect(comPromo.jaMigradaParaPrecoCheio()).toBe(false);

    const migrada = comPromo.marcarMigradaParaPrecoCheio(INICIO);
    expect(migrada.migradaParaPrecoCheioEm).toEqual(INICIO);
    expect(migrada.jaMigradaParaPrecoCheio()).toBe(true);
    expect(migrada.marcarMigradaParaPrecoCheio(INICIO)).toBe(migrada);
  });

  it("pendente de migração só após precoPromocionalAte e se ainda não migrada", () => {
    const comPromo = comCopiaPromocional();
    const ate = comPromo.precoPromocionalAte!;

    expect(assinaturaPendenteDeMigracaoPrecoCheio(comPromo, INICIO)).toBe(
      false,
    );
    expect(assinaturaPendenteDeMigracaoPrecoCheio(comPromo, ate)).toBe(true);

    const migrada = comPromo.marcarMigradaParaPrecoCheio(ate);
    expect(assinaturaPendenteDeMigracaoPrecoCheio(migrada, ate)).toBe(false);
  });
});
