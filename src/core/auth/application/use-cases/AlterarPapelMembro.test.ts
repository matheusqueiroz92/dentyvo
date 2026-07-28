import { describe, expect, it } from "vitest";

import {
  CroObrigatorioError,
  PermissaoNegadaError,
  ProfissionalNaoEncontradoError,
  TenantMismatchError,
} from "../../domain/errors";
import { Profissional } from "../../domain/Profissional";
import {
  FakeAuthPort,
  FakeProfissionalRepository,
} from "../test-doubles/fakes";
import { AlterarPapelMembro } from "./AlterarPapelMembro";

async function seedAdminComAlvo() {
  const profissionalRepo = new FakeProfissionalRepository();
  const auth = new FakeAuthPort();

  const adminUser = await auth.criarUsuario({
    nome: "Admin",
    email: "admin@c.com",
    senha: "s",
  });
  const admin = Profissional.criar({
    id: "prof-admin",
    clinicaId: "clinica-1",
    usuarioId: adminUser.id,
    nome: "Admin",
    papel: "admin",
  });
  await profissionalRepo.salvar(admin);

  const alvoUser = await auth.criarUsuario({
    nome: "Alvo",
    email: "alvo@c.com",
    senha: "s",
  });
  const alvo = Profissional.criar({
    id: "prof-alvo",
    clinicaId: "clinica-1",
    usuarioId: alvoUser.id,
    nome: "Alvo",
    papel: "recepcao",
  });
  await profissionalRepo.salvar(alvo);

  auth.definirSessao({
    usuarioId: adminUser.id,
    clinicaId: "clinica-1",
    papel: "admin",
    profissionalId: admin.id,
  });

  const sut = new AlterarPapelMembro(profissionalRepo, auth);
  return { sut, adminUser, profissionalRepo };
}

describe("AlterarPapelMembro", () => {
  it("admin altera papel de membro da própria clínica", async () => {
    const { sut, adminUser, profissionalRepo } = await seedAdminComAlvo();

    const atualizado = await sut.executar({
      clinicaId: "clinica-1",
      profissionalId: "prof-alvo",
      novoPapel: "admin",
      solicitadoPorUsuarioId: adminUser.id,
    });

    expect(atualizado.papel).toBe("admin");
    expect(
      (await profissionalRepo.buscarPorId("clinica-1", "prof-alvo"))?.papel,
    ).toBe("admin");
  });

  it("admin promove para dentista exigindo CRO", async () => {
    const { sut, adminUser } = await seedAdminComAlvo();

    await expect(
      sut.executar({
        clinicaId: "clinica-1",
        profissionalId: "prof-alvo",
        novoPapel: "dentista",
        solicitadoPorUsuarioId: adminUser.id,
      }),
    ).rejects.toBeInstanceOf(CroObrigatorioError);

    const comCro = await sut.executar({
      clinicaId: "clinica-1",
      profissionalId: "prof-alvo",
      novoPapel: "dentista",
      solicitadoPorUsuarioId: adminUser.id,
      cro: "CRO-99",
    });
    expect(comCro.papel).toBe("dentista");
    expect(comCro.cro).toBe("CRO-99");
  });

  it("recepção não pode alterar papel", async () => {
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

    const sut = new AlterarPapelMembro(profissionalRepo, auth);

    await expect(
      sut.executar({
        clinicaId: "clinica-1",
        profissionalId: "prof-alvo",
        novoPapel: "dentista",
        solicitadoPorUsuarioId: recepcaoUser.id,
        cro: "1",
      }),
    ).rejects.toBeInstanceOf(PermissaoNegadaError);
  });

  it("não altera membro de outra clínica", async () => {
    const { sut, adminUser, profissionalRepo } = await seedAdminComAlvo();
    await profissionalRepo.salvar(
      Profissional.criar({
        id: "prof-outra",
        clinicaId: "clinica-outra",
        usuarioId: "u-outra",
        nome: "Outra",
        papel: "recepcao",
      }),
    );

    await expect(
      sut.executar({
        clinicaId: "clinica-1",
        profissionalId: "prof-outra",
        novoPapel: "admin",
        solicitadoPorUsuarioId: adminUser.id,
      }),
    ).rejects.toBeInstanceOf(ProfissionalNaoEncontradoError);
  });

  it("rejeita clinicaId diferente da sessão", async () => {
    const { sut, adminUser } = await seedAdminComAlvo();

    await expect(
      sut.executar({
        clinicaId: "clinica-outra",
        profissionalId: "prof-alvo",
        novoPapel: "admin",
        solicitadoPorUsuarioId: adminUser.id,
      }),
    ).rejects.toBeInstanceOf(TenantMismatchError);
  });
});
