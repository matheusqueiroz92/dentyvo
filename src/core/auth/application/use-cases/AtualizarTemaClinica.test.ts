import { describe, expect, it } from "vitest";

import {
  DadosInvalidosError,
  PermissaoNegadaError,
  TenantMismatchError,
} from "../../domain/errors";
import { Clinica } from "../../domain/Clinica";
import { DocumentoFiscal } from "../../domain/DocumentoFiscal";
import type { Papel } from "../../domain/Papel";
import { Profissional } from "../../domain/Profissional";
import type { TemaClinica } from "../../domain/TemaClinica";
import {
  FakeAuthPort,
  FakeClinicaRepository,
  FakeProfissionalRepository,
} from "../test-doubles/fakes";
import { AtualizarTemaClinica } from "./AtualizarTemaClinica";

async function seed(papel: Papel) {
  const clinicaRepo = new FakeClinicaRepository();
  const profissionalRepo = new FakeProfissionalRepository();
  const auth = new FakeAuthPort();

  await clinicaRepo.salvar(
    Clinica.criar({
      id: "clinica-1",
      nome: "Clínica Um",
      endereco: "Rua A, 1",
      documento: DocumentoFiscal.criar("cpf", "39053344705"),
    }),
  );
  await clinicaRepo.salvar(
    Clinica.criar({
      id: "clinica-outra",
      nome: "Clínica Outra",
      endereco: "Rua B, 2",
      documento: DocumentoFiscal.criar("cnpj", "11222333000181"),
    }),
  );

  const usuario = await auth.criarUsuario({
    nome: `User ${papel}`,
    email: `${papel}@c.com`,
    senha: "s",
  });
  await profissionalRepo.salvar(
    Profissional.criar({
      id: `prof-${papel}`,
      clinicaId: "clinica-1",
      usuarioId: usuario.id,
      nome: `User ${papel}`,
      papel,
      cro: papel === "dentista" ? "12345" : null,
    }),
  );

  const sut = new AtualizarTemaClinica(clinicaRepo, profissionalRepo);
  return { sut, clinicaRepo, usuario };
}

describe("AtualizarTemaClinica", () => {
  it("admin define tema pré-definido da própria clínica", async () => {
    const { sut, clinicaRepo, usuario } = await seed("admin");

    const atualizada = await sut.executar({
      clinicaId: "clinica-1",
      solicitadoPorUsuarioId: usuario.id,
      tema: "verde",
    });

    expect(atualizada.tema).toBe("verde");
    expect((await clinicaRepo.buscarPorId("clinica-1"))?.tema).toBe("verde");
  });

  it("admin pode restaurar tema padrão com null", async () => {
    const { sut, clinicaRepo, usuario } = await seed("admin");
    await clinicaRepo.salvar(
      (await clinicaRepo.buscarPorId("clinica-1"))!.atualizarTema("roxo"),
    );

    const atualizada = await sut.executar({
      clinicaId: "clinica-1",
      solicitadoPorUsuarioId: usuario.id,
      tema: null,
    });

    expect(atualizada.tema).toBeNull();
  });

  it("rejeita tema fora do enum com erro de domínio", async () => {
    const { sut, usuario } = await seed("admin");

    await expect(
      sut.executar({
        clinicaId: "clinica-1",
        solicitadoPorUsuarioId: usuario.id,
        tema: "neon-cyber" as TemaClinica,
      }),
    ).rejects.toBeInstanceOf(DadosInvalidosError);
  });

  it.each(["dentista", "recepcao"] as const)(
    "%s não pode atualizar tema",
    async (papel) => {
      const { sut, usuario } = await seed(papel);

      await expect(
        sut.executar({
          clinicaId: "clinica-1",
          solicitadoPorUsuarioId: usuario.id,
          tema: "grafite",
        }),
      ).rejects.toBeInstanceOf(PermissaoNegadaError);
    },
  );

  it("não reverte nome alterado concorrentemente ao atualizar só o tema", async () => {
    const { sut, clinicaRepo, usuario } = await seed("admin");
    const buscarOriginal = clinicaRepo.buscarPorId.bind(clinicaRepo);

    clinicaRepo.buscarPorId = async (id: string) => {
      const snapshot = await buscarOriginal(id);
      if (snapshot && id === "clinica-1") {
        clinicaRepo.items.set(
          id,
          snapshot.atualizarDadosCadastrais({ nome: "Nome Concorrente" }),
        );
      }
      return snapshot;
    };

    await sut.executar({
      clinicaId: "clinica-1",
      solicitadoPorUsuarioId: usuario.id,
      tema: "verde",
    });

    const persistida = await buscarOriginal("clinica-1");
    expect(persistida?.tema).toBe("verde");
    expect(persistida?.nome).toBe("Nome Concorrente");
  });

  it("não atualiza tema de outra clínica (isolamento de tenant)", async () => {
    const { sut, clinicaRepo, usuario } = await seed("admin");

    await expect(
      sut.executar({
        clinicaId: "clinica-outra",
        solicitadoPorUsuarioId: usuario.id,
        tema: "verde",
      }),
    ).rejects.toBeInstanceOf(TenantMismatchError);

    expect((await clinicaRepo.buscarPorId("clinica-outra"))?.tema).toBeNull();
  });
});
