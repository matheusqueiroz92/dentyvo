import { describe, expect, it } from "vitest";

import {
  ClinicaNaoEncontradaError,
  DadosInvalidosError,
  PermissaoNegadaError,
  TenantMismatchError,
} from "../../domain/errors";
import { Clinica } from "../../domain/Clinica";
import { DocumentoFiscal } from "../../domain/DocumentoFiscal";
import type { Papel } from "../../domain/Papel";
import { Profissional } from "../../domain/Profissional";
import {
  CNPJ_VALIDO,
  CPF_VALIDO,
  FakeAuthPort,
  FakeClinicaRepository,
  FakeProfissionalRepository,
} from "../test-doubles/fakes";
import { AtualizarClinica } from "./AtualizarClinica";

const LOGO_URL = "https://blob.vercel-storage.com/clinicas/cli-1/logo.png";
const DOCUMENTO = DocumentoFiscal.criar("cpf", CPF_VALIDO);

async function seed(papel: Papel) {
  const clinicaRepo = new FakeClinicaRepository();
  const profissionalRepo = new FakeProfissionalRepository();
  const auth = new FakeAuthPort();

  const clinica = Clinica.criar({
    id: "clinica-1",
    nome: "Clínica Um",
    endereco: "Rua A, 1",
    documento: DOCUMENTO,
  })
    .atualizarSlug("clinica-um")
    .atualizarLogo(LOGO_URL)
    .atualizarTema("verde");
  await clinicaRepo.salvar(clinica);

  await clinicaRepo.salvar(
    Clinica.criar({
      id: "clinica-outra",
      nome: "Clínica Outra",
      endereco: "Rua B, 2",
      documento: DocumentoFiscal.criar("cnpj", CNPJ_VALIDO),
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

  const sut = new AtualizarClinica(clinicaRepo, profissionalRepo);
  return { sut, clinicaRepo, profissionalRepo, auth, usuario, clinica };
}

function identidadePreservada(clinica: Clinica) {
  expect(clinica.documento.equals(DOCUMENTO)).toBe(true);
  expect(clinica.status).toBe("ativa");
  expect(clinica.slug).toBe("clinica-um");
  expect(clinica.logoUrl).toBe(LOGO_URL);
  expect(clinica.tema).toBe("verde");
}

describe("AtualizarClinica", () => {
  it("admin atualiza só o nome e preserva o endereço", async () => {
    const { sut, usuario } = await seed("admin");

    const atualizada = await sut.executar({
      clinicaId: "clinica-1",
      solicitadoPorUsuarioId: usuario.id,
      nome: " Clínica Renomeada ",
    });

    expect(atualizada.nome).toBe("Clínica Renomeada");
    expect(atualizada.endereco).toBe("Rua A, 1");
    identidadePreservada(atualizada);
  });

  it("admin atualiza só o endereço e preserva o nome", async () => {
    const { sut, usuario } = await seed("admin");

    const atualizada = await sut.executar({
      clinicaId: "clinica-1",
      solicitadoPorUsuarioId: usuario.id,
      endereco: " Av. Nova, 10 ",
    });

    expect(atualizada.nome).toBe("Clínica Um");
    expect(atualizada.endereco).toBe("Av. Nova, 10");
    identidadePreservada(atualizada);
  });

  it("rejeita quando nome e endereço são omitidos", async () => {
    const { sut, usuario, clinicaRepo } = await seed("admin");

    await expect(
      sut.executar({
        clinicaId: "clinica-1",
        solicitadoPorUsuarioId: usuario.id,
      }),
    ).rejects.toBeInstanceOf(DadosInvalidosError);

    const persistida = await clinicaRepo.buscarPorId("clinica-1");
    expect(persistida?.nome).toBe("Clínica Um");
    expect(persistida?.endereco).toBe("Rua A, 1");
  });

  it("rejeita string vazia — não limpa nome nem endereço em silêncio", async () => {
    const { sut, usuario, clinicaRepo } = await seed("admin");

    await expect(
      sut.executar({
        clinicaId: "clinica-1",
        solicitadoPorUsuarioId: usuario.id,
        nome: "   ",
      }),
    ).rejects.toBeInstanceOf(DadosInvalidosError);

    await expect(
      sut.executar({
        clinicaId: "clinica-1",
        solicitadoPorUsuarioId: usuario.id,
        endereco: "",
      }),
    ).rejects.toBeInstanceOf(DadosInvalidosError);

    const persistida = await clinicaRepo.buscarPorId("clinica-1");
    expect(persistida?.nome).toBe("Clínica Um");
    expect(persistida?.endereco).toBe("Rua A, 1");
  });

  it.each(["dentista", "recepcao"] as const)(
    "%s não pode atualizar dados cadastrais da clínica",
    async (papel) => {
      const { sut, usuario, clinicaRepo } = await seed(papel);

      await expect(
        sut.executar({
          clinicaId: "clinica-1",
          solicitadoPorUsuarioId: usuario.id,
          nome: "Tentativa",
        }),
      ).rejects.toBeInstanceOf(PermissaoNegadaError);

      expect((await clinicaRepo.buscarPorId("clinica-1"))?.nome).toBe(
        "Clínica Um",
      );
    },
  );

  it("lança ClinicaNaoEncontradaError quando a clínica da sessão não existe", async () => {
    const { sut, profissionalRepo, auth } = await seed("admin");
    const usuario = await auth.criarUsuario({
      nome: "Admin fantasma",
      email: "fantasma@c.com",
      senha: "s",
    });
    await profissionalRepo.salvar(
      Profissional.criar({
        id: "prof-fantasma",
        clinicaId: "clinica-fantasma",
        usuarioId: usuario.id,
        nome: "Admin fantasma",
        papel: "admin",
      }),
    );

    await expect(
      sut.executar({
        clinicaId: "clinica-fantasma",
        solicitadoPorUsuarioId: usuario.id,
        nome: "Qualquer",
      }),
    ).rejects.toBeInstanceOf(ClinicaNaoEncontradaError);
  });

  it("não atualiza clínica de outro tenant", async () => {
    const { sut, clinicaRepo, usuario } = await seed("admin");

    await expect(
      sut.executar({
        clinicaId: "clinica-outra",
        solicitadoPorUsuarioId: usuario.id,
        nome: "Invasão",
      }),
    ).rejects.toBeInstanceOf(TenantMismatchError);

    const outra = await clinicaRepo.buscarPorId("clinica-outra");
    expect(outra?.nome).toBe("Clínica Outra");
    expect(outra?.endereco).toBe("Rua B, 2");
  });
});
