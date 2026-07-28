import { describe, expect, it } from "vitest";

import { ClinicWhatsappAccount } from "../../domain/ClinicWhatsappAccount";
import { ANTECEDENCIA_RENOVACAO_TOKEN_MS } from "../../domain/constants";
import {
  ContaWhatsappNaoEncontradaError,
  TokenWhatsappInvalidoError,
} from "../../domain/errors";
import {
  FakeClinicWhatsappAccountRepository,
  FakeCriptografiaPort,
  FakeMetaGraphApiPort,
} from "../test-doubles/fakes";
import { RenovarTokenWhatsapp } from "./RenovarTokenWhatsapp";

const clinicaId = "clinica-1";
const tokenExpiraEm = new Date("2026-08-01T00:00:00.000Z");

function criarContaConectada(expiraEm: Date = tokenExpiraEm) {
  return ClinicWhatsappAccount.criarPendente({
    id: "conta-1",
    clinicaId,
  }).concluirConexao({
    wabaId: "waba-1",
    phoneNumberId: "phone-1",
    accessTokenCriptografado: "enc:token-atual",
    tokenExpiraEm: expiraEm,
  });
}

describe("RenovarTokenWhatsapp", () => {
  it("renova token sem checagem de papel (job não recebe solicitadoPorUsuarioId)", async () => {
    const contaRepo = new FakeClinicWhatsappAccountRepository();
    const criptografia = new FakeCriptografiaPort();
    const meta = new FakeMetaGraphApiPort({
      renovacao: {
        accessToken: "token-novo",
        expiraEm: new Date("2031-01-01T00:00:00.000Z"),
      },
    });
    await contaRepo.salvar(criarContaConectada());

    const sut = new RenovarTokenWhatsapp(contaRepo, meta, criptografia);
    const agora = new Date(
      tokenExpiraEm.getTime() - ANTECEDENCIA_RENOVACAO_TOKEN_MS + 1,
    );

    // Assinatura do job: só clinicaId (+ relógio) — sem profissional/papel.
    await sut.executar({ clinicaId, agora });

    const conta = await contaRepo.buscarPorClinicaId(clinicaId);
    expect(conta!.status).toBe("conectado");
    expect(conta!.accessTokenCriptografado).toBe("enc:token-novo");
    expect(meta.renovacoes).toEqual(["token-atual"]);
  });

  it("não chama a Meta quando ainda não precisa renovar", async () => {
    const contaRepo = new FakeClinicWhatsappAccountRepository();
    const criptografia = new FakeCriptografiaPort();
    const meta = new FakeMetaGraphApiPort();
    await contaRepo.salvar(criarContaConectada());

    const sut = new RenovarTokenWhatsapp(contaRepo, meta, criptografia);
    const agora = new Date(
      tokenExpiraEm.getTime() - ANTECEDENCIA_RENOVACAO_TOKEN_MS - 60_000,
    );

    await sut.executar({ clinicaId, agora });

    expect(meta.renovacoes).toHaveLength(0);
    expect((await contaRepo.buscarPorClinicaId(clinicaId))!.status).toBe(
      "conectado",
    );
  });

  it("falha na renovação invalida a conta para desconectado e bloqueia envio", async () => {
    const contaRepo = new FakeClinicWhatsappAccountRepository();
    const criptografia = new FakeCriptografiaPort();
    const meta = new FakeMetaGraphApiPort({ falharRenovacao: true });
    await contaRepo.salvar(criarContaConectada());

    const sut = new RenovarTokenWhatsapp(contaRepo, meta, criptografia);
    const agora = new Date(
      tokenExpiraEm.getTime() - ANTECEDENCIA_RENOVACAO_TOKEN_MS + 1,
    );

    await expect(sut.executar({ clinicaId, agora })).rejects.toBeInstanceOf(
      TokenWhatsappInvalidoError,
    );

    const conta = await contaRepo.buscarPorClinicaId(clinicaId);
    expect(conta!.status).toBe("desconectado");
    expect(conta!.accessTokenCriptografado).toBeNull();
    expect(conta!.podeEnviarMensagens()).toBe(false);
  });

  it("falha quando a clínica não tem conta WhatsApp", async () => {
    const sut = new RenovarTokenWhatsapp(
      new FakeClinicWhatsappAccountRepository(),
      new FakeMetaGraphApiPort(),
      new FakeCriptografiaPort(),
    );

    await expect(sut.executar({ clinicaId })).rejects.toBeInstanceOf(
      ContaWhatsappNaoEncontradaError,
    );
  });
});
