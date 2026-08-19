import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ANTECEDENCIA_RENOVACAO_TOKEN_MS } from "../../domain/constants";
import { ClinicWhatsappAccount } from "../../domain/ClinicWhatsappAccount";
import {
  FakeClinicWhatsappAccountRepository,
  FakeCriptografiaPort,
  FakeMetaGraphApiPort,
} from "../test-doubles/fakes";
import { ProcessarRenovacaoTokensWhatsapp } from "./ProcessarRenovacaoTokensWhatsapp";
import { RenovarTokenWhatsapp } from "./RenovarTokenWhatsapp";

const AGORA = new Date("2026-08-19T12:00:00.000Z");

/** Dentro da janela de 7 dias → deve renovar. */
const EXPIRA_DENTRO_DA_JANELA = new Date(
  AGORA.getTime() + ANTECEDENCIA_RENOVACAO_TOKEN_MS - 60_000,
);
/** Fora da janela → não deve ser tocada. */
const EXPIRA_FORA_DA_JANELA = new Date(
  AGORA.getTime() + ANTECEDENCIA_RENOVACAO_TOKEN_MS + 60 * 60 * 1000,
);

function contaConectada(clinicaId: string, tokenExpiraEm: Date) {
  return ClinicWhatsappAccount.criarPendente({
    id: `conta-${clinicaId}`,
    clinicaId,
  }).concluirConexao({
    wabaId: `waba-${clinicaId}`,
    phoneNumberId: `phone-${clinicaId}`,
    accessTokenCriptografado: "enc:token-original",
    tokenExpiraEm,
  });
}

function montar(options?: { falharRenovacao?: boolean }) {
  const contaRepo = new FakeClinicWhatsappAccountRepository();
  const criptografia = new FakeCriptografiaPort();
  const meta = new FakeMetaGraphApiPort({
    falharRenovacao: options?.falharRenovacao,
  });
  const renovar = new RenovarTokenWhatsapp(contaRepo, meta, criptografia);

  return {
    contaRepo,
    meta,
    sut: new ProcessarRenovacaoTokensWhatsapp(contaRepo, renovar),
  };
}

describe("ProcessarRenovacaoTokensWhatsapp", () => {
  beforeEach(() => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("não faz nada quando nenhuma conta está na janela de renovação", async () => {
    const { sut, contaRepo, meta } = montar();
    await contaRepo.salvar(contaConectada("clinica-a", EXPIRA_FORA_DA_JANELA));

    const resultado = await sut.executar({ agora: AGORA });

    expect(resultado).toEqual({ processados: 0, renovados: 0, falhas: 0 });
    expect(meta.renovacoes).toEqual([]);
  });

  it("renova as contas dentro da janela de antecedência", async () => {
    const { sut, contaRepo, meta } = montar();
    await contaRepo.salvar(contaConectada("clinica-a", EXPIRA_DENTRO_DA_JANELA));

    const resultado = await sut.executar({ agora: AGORA });

    expect(resultado).toEqual({ processados: 1, renovados: 1, falhas: 0 });
    expect(meta.renovacoes).toEqual(["token-original"]);

    const atualizada = await contaRepo.buscarPorClinicaId("clinica-a");
    expect(atualizada?.status).toBe("conectado");
    expect(atualizada?.accessTokenCriptografado).toBe(
      "enc:token-original-renovado",
    );
  });

  it("processa várias clínicas no mesmo lote", async () => {
    const { sut, contaRepo } = montar();
    await contaRepo.salvar(contaConectada("clinica-a", EXPIRA_DENTRO_DA_JANELA));
    await contaRepo.salvar(contaConectada("clinica-b", EXPIRA_DENTRO_DA_JANELA));

    const resultado = await sut.executar({ agora: AGORA });

    expect(resultado).toEqual({ processados: 2, renovados: 2, falhas: 0 });
  });

  it("isola a falha de uma clínica e segue renovando as demais", async () => {
    const contaRepo = new FakeClinicWhatsappAccountRepository();
    const criptografia = new FakeCriptografiaPort();
    const meta = new FakeMetaGraphApiPort();
    const renovar = new RenovarTokenWhatsapp(contaRepo, meta, criptografia);
    const sut = new ProcessarRenovacaoTokensWhatsapp(contaRepo, renovar);

    await contaRepo.salvar(contaConectada("clinica-ok", EXPIRA_DENTRO_DA_JANELA));
    await contaRepo.salvar(
      contaConectada("clinica-ruim", EXPIRA_DENTRO_DA_JANELA),
    );

    const original = renovar.executar.bind(renovar);
    vi.spyOn(renovar, "executar").mockImplementation(async (input) => {
      if (input.clinicaId === "clinica-ruim") {
        throw new Error("token revogado na Meta");
      }
      return original(input);
    });

    const resultado = await sut.executar({ agora: AGORA });

    expect(resultado).toEqual({ processados: 2, renovados: 1, falhas: 1 });
    const ok = await contaRepo.buscarPorClinicaId("clinica-ok");
    expect(ok?.accessTokenCriptografado).toBe("enc:token-original-renovado");
  });

  it("conta como falha quando a Meta rejeita a renovação e desconecta a conta", async () => {
    const { sut, contaRepo } = montar({ falharRenovacao: true });
    await contaRepo.salvar(contaConectada("clinica-a", EXPIRA_DENTRO_DA_JANELA));

    const resultado = await sut.executar({ agora: AGORA });

    expect(resultado).toEqual({ processados: 1, renovados: 0, falhas: 1 });
    const atualizada = await contaRepo.buscarPorClinicaId("clinica-a");
    expect(atualizada?.status).toBe("desconectado");
    expect(atualizada?.accessTokenCriptografado).toBeNull();
  });

  it("ignora contas desconectadas", async () => {
    const { sut, contaRepo, meta } = montar();
    await contaRepo.salvar(
      contaConectada("clinica-a", EXPIRA_DENTRO_DA_JANELA).desconectar(),
    );

    const resultado = await sut.executar({ agora: AGORA });

    expect(resultado).toEqual({ processados: 0, renovados: 0, falhas: 0 });
    expect(meta.renovacoes).toEqual([]);
  });
});
