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
import { RevogarSessoesDoMembro } from "./RevogarSessoesDoMembro";

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
      papel: "recepcao",
    }),
  );

  auth.definirSessao({
    usuarioId: adminUser.id,
    clinicaId: "clinica-1",
    papel: "admin",
    profissionalId: "prof-admin",
  });

  return {
    sut: new RevogarSessoesDoMembro(profissionalRepo, auth),
    adminUser,
    alvoUser,
    auth,
  };
}

describe("RevogarSessoesDoMembro", () => {
  it("admin revoga sessões de membro da própria clínica", async () => {
    const { sut, adminUser, alvoUser, auth } = await seedAdminComAlvo();

    await sut.executar({
      clinicaId: "clinica-1",
      profissionalId: "prof-alvo",
      solicitadoPorUsuarioId: adminUser.id,
    });

    expect(auth.sessoesRevogadas).toContain(alvoUser.id);
  });

  it("recepção não pode revogar sessões de outro membro", async () => {
    const profissionalRepo = new FakeProfissionalRepository();
    const auth = new FakeAuthPort();
    const recepcaoUser = await auth.criarUsuario({
      nome: "Rec",
      email: "rec@c.com",
      senha: "s",
    });
    await profissionalRepo.salvar(
      Profissional.criar({
        id: "prof-rec",
        clinicaId: "clinica-1",
        usuarioId: recepcaoUser.id,
        nome: "Rec",
        papel: "recepcao",
      }),
    );
    await profissionalRepo.salvar(
      Profissional.criar({
        id: "prof-alvo",
        clinicaId: "clinica-1",
        usuarioId: "u-alvo",
        nome: "Alvo",
        papel: "admin",
      }),
    );
    auth.definirSessao({
      usuarioId: recepcaoUser.id,
      clinicaId: "clinica-1",
      papel: "recepcao",
      profissionalId: "prof-rec",
    });

    const sut = new RevogarSessoesDoMembro(profissionalRepo, auth);

    await expect(
      sut.executar({
        clinicaId: "clinica-1",
        profissionalId: "prof-alvo",
        solicitadoPorUsuarioId: recepcaoUser.id,
      }),
    ).rejects.toBeInstanceOf(PermissaoNegadaError);
  });

  it("não revoga sessões de profissional de outra clínica", async () => {
    const { sut, adminUser } = await seedAdminComAlvo();

    await expect(
      sut.executar({
        clinicaId: "clinica-1",
        profissionalId: "prof-inexistente",
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
