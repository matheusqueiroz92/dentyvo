import { describe, expect, it } from "vitest";

import { CONVITE_TTL_MS } from "../../domain/constants";
import { Convite } from "../../domain/Convite";
import {
  ConviteExpiradoError,
  ConviteJaAceitoError,
  ConviteNaoEncontradoError,
  CroObrigatorioError,
} from "../../domain/errors";
import {
  FakeAuthPort,
  FakeConviteRepository,
  FakeProfissionalRepository,
} from "../test-doubles/fakes";
import { AceitarConvite } from "./AceitarConvite";

function criarSut() {
  const conviteRepo = new FakeConviteRepository();
  const profissionalRepo = new FakeProfissionalRepository();
  const auth = new FakeAuthPort();
  const sut = new AceitarConvite(conviteRepo, profissionalRepo, auth);
  return { sut, conviteRepo, profissionalRepo, auth };
}

describe("AceitarConvite", () => {
  it("aceita convite válido e cria profissional na clínica do convite", async () => {
    const { sut, conviteRepo, profissionalRepo, auth } = criarSut();
    const convite = Convite.criar({
      id: "cv-1",
      clinicaId: "clinica-1",
      email: "novo@email.com",
      papel: "recepcao",
      token: "token-ok",
      convidadoPorUsuarioId: "admin-1",
    });
    await conviteRepo.salvar(convite);

    const profissional = await sut.executar({
      token: "token-ok",
      nome: "Nova Pessoa",
      senha: "senha-forte",
    });

    expect(profissional.clinicaId).toBe("clinica-1");
    expect(profissional.papel).toBe("recepcao");
    expect(profissional.nome).toBe("Nova Pessoa");

    const usuario = await auth.buscarUsuarioPorEmail("novo@email.com");
    expect(usuario).not.toBeNull();
    expect(profissional.usuarioId).toBe(usuario!.id);
    expect(
      await profissionalRepo.buscarPorId("clinica-1", profissional.id),
    ).not.toBeNull();

    const conviteAtualizado = await conviteRepo.buscarPorToken("token-ok");
    expect(conviteAtualizado?.estaPendente()).toBe(false);
  });

  it("exige CRO ao aceitar convite de dentista", async () => {
    const { sut, conviteRepo } = criarSut();
    await conviteRepo.salvar(
      Convite.criar({
        id: "cv-1",
        clinicaId: "clinica-1",
        email: "dentista@email.com",
        papel: "dentista",
        token: "token-dent",
        convidadoPorUsuarioId: "admin-1",
      }),
    );

    await expect(
      sut.executar({
        token: "token-dent",
        nome: "Dr. Novo",
        senha: "senha",
      }),
    ).rejects.toBeInstanceOf(CroObrigatorioError);
  });

  it("rejeita convite expirado após 72 horas", async () => {
    const { sut, conviteRepo } = criarSut();
    const criadoEm = new Date("2026-07-01T00:00:00.000Z");
    await conviteRepo.salvar(
      Convite.criar({
        id: "cv-1",
        clinicaId: "clinica-1",
        email: "expira@email.com",
        papel: "admin",
        token: "token-exp",
        convidadoPorUsuarioId: "admin-1",
        agora: criadoEm,
      }),
    );

    // Congela o "agora" do domínio via reconstituição já expirada no repo:
    // o use case deve consultar o tempo atual; salvamos convite já no limite.
    const expirado = Convite.reconstituir({
      id: "cv-2",
      clinicaId: "clinica-1",
      email: "expira2@email.com",
      papel: "admin",
      token: "token-exp-2",
      expiresAt: new Date(Date.now() - 1),
      aceitoEm: null,
      convidadoPorUsuarioId: "admin-1",
    });
    await conviteRepo.salvar(expirado);

    await expect(
      sut.executar({
        token: "token-exp-2",
        nome: "Tarde",
        senha: "senha",
      }),
    ).rejects.toBeInstanceOf(ConviteExpiradoError);

    // Garante que 72h é a janela de domínio usada na criação
    const fresco = Convite.criar({
      id: "cv-3",
      clinicaId: "c",
      email: "x@y.com",
      papel: "admin",
      token: "t",
      convidadoPorUsuarioId: "a",
      agora: criadoEm,
    });
    expect(fresco.expiresAt.getTime() - criadoEm.getTime()).toBe(CONVITE_TTL_MS);
  });

  it("rejeita convite já aceito", async () => {
    const { sut, conviteRepo } = criarSut();
    const base = Convite.criar({
      id: "cv-1",
      clinicaId: "clinica-1",
      email: "uma@email.com",
      papel: "recepcao",
      token: "token-1",
      convidadoPorUsuarioId: "admin-1",
    });
    await conviteRepo.salvar(base.aceitar());

    await expect(
      sut.executar({
        token: "token-1",
        nome: "Outra",
        senha: "senha",
      }),
    ).rejects.toBeInstanceOf(ConviteJaAceitoError);
  });

  it("rejeita token inexistente", async () => {
    const { sut } = criarSut();

    await expect(
      sut.executar({
        token: "nao-existe",
        nome: "X",
        senha: "senha",
      }),
    ).rejects.toBeInstanceOf(ConviteNaoEncontradoError);
  });
});
