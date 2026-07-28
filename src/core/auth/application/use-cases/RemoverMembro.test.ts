import { describe, expect, it } from "vitest";

import {
  PermissaoNegadaError,
  ProfissionalNaoEncontradoError,
  TenantMismatchError,
} from "../../domain/errors";
import { Profissional } from "../../domain/Profissional";
import {
  FakeAuthPort,
  FakeProfissionalRepository,
} from "../test-doubles/fakes";
import { RemoverMembro } from "./RemoverMembro";

async function seedAdminComAlvo() {
  const profissionalRepo = new FakeProfissionalRepository();
  const auth = new FakeAuthPort();

  const adminUser = await auth.criarUsuario({
    nome: "Admin",
    email: "admin@c.com",
    senha: "s",
  });
  await profissionalRepo.salvar(
    Profissional.criar({
      id: "prof-admin",
      clinicaId: "clinica-1",
      usuarioId: adminUser.id,
      nome: "Admin",
      papel: "admin",
    }),
  );

  const alvoUser = await auth.criarUsuario({
    nome: "Alvo",
    email: "alvo@c.com",
    senha: "s",
  });
  await profissionalRepo.salvar(
    Profissional.criar({
      id: "prof-alvo",
      clinicaId: "clinica-1",
      usuarioId: alvoUser.id,
      nome: "Alvo",
      papel: "dentista",
      cro: "123",
    }),
  );

  auth.definirSessao({
    usuarioId: adminUser.id,
    clinicaId: "clinica-1",
    papel: "admin",
    profissionalId: "prof-admin",
  });

  return {
    sut: new RemoverMembro(profissionalRepo, auth),
    adminUser,
    profissionalRepo,
  };
}

describe("RemoverMembro", () => {
  it("admin remove membro da própria clínica", async () => {
    const { sut, adminUser, profissionalRepo } = await seedAdminComAlvo();

    await sut.executar({
      clinicaId: "clinica-1",
      profissionalId: "prof-alvo",
      solicitadoPorUsuarioId: adminUser.id,
    });

    expect(
      await profissionalRepo.buscarPorId("clinica-1", "prof-alvo"),
    ).toBeNull();
  });

  it("dentista não pode remover membro", async () => {
    const profissionalRepo = new FakeProfissionalRepository();
    const auth = new FakeAuthPort();
    const dentistaUser = await auth.criarUsuario({
      nome: "Dent",
      email: "dent@c.com",
      senha: "s",
    });
    await profissionalRepo.salvar(
      Profissional.criar({
        id: "prof-dent",
        clinicaId: "clinica-1",
        usuarioId: dentistaUser.id,
        nome: "Dent",
        papel: "dentista",
        cro: "1",
      }),
    );
    await profissionalRepo.salvar(
      Profissional.criar({
        id: "prof-alvo",
        clinicaId: "clinica-1",
        usuarioId: "u-alvo",
        nome: "Alvo",
        papel: "recepcao",
      }),
    );
    auth.definirSessao({
      usuarioId: dentistaUser.id,
      clinicaId: "clinica-1",
      papel: "dentista",
      profissionalId: "prof-dent",
    });

    const sut = new RemoverMembro(profissionalRepo, auth);

    await expect(
      sut.executar({
        clinicaId: "clinica-1",
        profissionalId: "prof-alvo",
        solicitadoPorUsuarioId: dentistaUser.id,
      }),
    ).rejects.toBeInstanceOf(PermissaoNegadaError);
  });

  it("não remove membro inexistente na clínica da sessão", async () => {
    const { sut, adminUser } = await seedAdminComAlvo();

    await expect(
      sut.executar({
        clinicaId: "clinica-1",
        profissionalId: "nao-existe",
        solicitadoPorUsuarioId: adminUser.id,
      }),
    ).rejects.toBeInstanceOf(ProfissionalNaoEncontradoError);
  });

  it("rejeita clinicaId diferente da sessão", async () => {
    const { sut, adminUser } = await seedAdminComAlvo();

    await expect(
      sut.executar({
        clinicaId: "outra",
        profissionalId: "prof-alvo",
        solicitadoPorUsuarioId: adminUser.id,
      }),
    ).rejects.toBeInstanceOf(TenantMismatchError);
  });
});
