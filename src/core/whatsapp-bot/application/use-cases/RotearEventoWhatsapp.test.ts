import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { MockInstance } from "vitest";

import { ClinicWhatsappAccount } from "../../domain/ClinicWhatsappAccount";
import { FakeClinicWhatsappAccountRepository } from "../test-doubles/fakes";
import { RotearEventoWhatsapp } from "./RotearEventoWhatsapp";

function contaConectada(clinicaId: string, phoneNumberId: string) {
  return ClinicWhatsappAccount.criarPendente({
    id: `conta-${clinicaId}`,
    clinicaId,
  }).concluirConexao({
    wabaId: `waba-${clinicaId}`,
    phoneNumberId,
    accessTokenCriptografado: "enc:token",
    tokenExpiraEm: new Date("2030-01-01T00:00:00.000Z"),
  });
}

describe("RotearEventoWhatsapp", () => {
  let contaRepo: FakeClinicWhatsappAccountRepository;
  let sut: RotearEventoWhatsapp;
  let warn: MockInstance<typeof console.warn>;

  beforeEach(() => {
    contaRepo = new FakeClinicWhatsappAccountRepository();
    sut = new RotearEventoWhatsapp(contaRepo);
    warn = vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("resolve a clínica dona de cada phone_number_id", async () => {
    await contaRepo.salvar(contaConectada("clinica-a", "phone-a"));

    const resultado = await sut.executar({ phoneNumberIds: ["phone-a"] });

    expect(resultado.reconhecidos).toEqual([
      { phoneNumberId: "phone-a", clinicaId: "clinica-a" },
    ]);
    expect(resultado.descartados).toEqual([]);
  });

  it("roteia clínicas simultâneas distintas sem misturar tenant", async () => {
    await contaRepo.salvar(contaConectada("clinica-a", "phone-a"));
    await contaRepo.salvar(contaConectada("clinica-b", "phone-b"));

    const resultado = await sut.executar({
      phoneNumberIds: ["phone-b", "phone-a"],
    });

    expect(resultado.reconhecidos).toEqual([
      { phoneNumberId: "phone-b", clinicaId: "clinica-b" },
      { phoneNumberId: "phone-a", clinicaId: "clinica-a" },
    ]);
    expect(resultado.descartados).toEqual([]);
  });

  it("descarta phone_number_id sem conta correspondente e segue com os demais", async () => {
    await contaRepo.salvar(contaConectada("clinica-a", "phone-a"));

    const resultado = await sut.executar({
      phoneNumberIds: ["phone-desconhecido", "phone-a"],
    });

    expect(resultado.descartados).toEqual(["phone-desconhecido"]);
    expect(resultado.reconhecidos).toEqual([
      { phoneNumberId: "phone-a", clinicaId: "clinica-a" },
    ]);
  });

  it("registra log ao descartar phone_number_id desconhecido", async () => {
    await sut.executar({ phoneNumberIds: ["phone-desconhecido"] });

    expect(warn).toHaveBeenCalledOnce();
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining("whatsapp:webhook"),
      expect.objectContaining({ phoneNumberId: "phone-desconhecido" }),
    );
  });

  it("não lança quando nenhum phone_number_id é reconhecido", async () => {
    await expect(
      sut.executar({ phoneNumberIds: ["a", "b"] }),
    ).resolves.toEqual({ reconhecidos: [], descartados: ["a", "b"] });
  });

  it("descarta conta que não está apta a operar (desconectada)", async () => {
    const desconectada = contaConectada("clinica-a", "phone-a").desconectar();
    await contaRepo.salvar(desconectada);

    const resultado = await sut.executar({ phoneNumberIds: ["phone-a"] });

    expect(resultado.reconhecidos).toEqual([]);
    expect(resultado.descartados).toEqual(["phone-a"]);
  });

  it("aceita lista vazia sem consultar o repositório", async () => {
    const busca = vi.spyOn(contaRepo, "buscarPorPhoneNumberId");

    const resultado = await sut.executar({ phoneNumberIds: [] });

    expect(resultado).toEqual({ reconhecidos: [], descartados: [] });
    expect(busca).not.toHaveBeenCalled();
  });
});
