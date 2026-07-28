import { describe, expect, it } from "vitest";

import {
  DocumentoClinicaDuplicadoError,
  UsuarioJaVinculadoAClinicaError,
} from "../../domain/errors";
import {
  CNPJ_VALIDO,
  CPF_VALIDO,
  FakeAuthPort,
  FakeClinicaRepository,
  FakeProfissionalRepository,
} from "../test-doubles/fakes";
import { CriarClinicaComAdmin } from "./CriarClinicaComAdmin";

function criarSut() {
  const clinicaRepo = new FakeClinicaRepository();
  const profissionalRepo = new FakeProfissionalRepository();
  const auth = new FakeAuthPort();
  const sut = new CriarClinicaComAdmin(clinicaRepo, profissionalRepo, auth);
  return { sut, clinicaRepo, profissionalRepo, auth };
}

describe("CriarClinicaComAdmin", () => {
  it("cria clínica ativa, usuário auth e profissional admin atomicamente", async () => {
    const { sut, clinicaRepo, profissionalRepo, auth } = criarSut();

    const clinica = await sut.executar({
      clinica: {
        nome: "Consultório Ana",
        endereco: "Rua A, 1",
        tipoDocumento: "cpf",
        documento: CPF_VALIDO,
      },
      admin: {
        nome: "Ana Admin",
        email: "ana@clinica.com",
        senha: "senha-segura",
      },
    });

    expect(clinica.status).toBe("ativa");
    expect(clinica.documento.tipo).toBe("cpf");
    expect(await clinicaRepo.buscarPorId(clinica.id)).not.toBeNull();

    const usuario = await auth.buscarUsuarioPorEmail("ana@clinica.com");
    expect(usuario).not.toBeNull();

    const profissional = await profissionalRepo.buscarPorUsuarioId(usuario!.id);
    expect(profissional?.papel).toBe("admin");
    expect(profissional?.clinicaId).toBe(clinica.id);
  });

  it("aceita CNPJ no cadastro da clínica", async () => {
    const { sut } = criarSut();

    const clinica = await sut.executar({
      clinica: {
        nome: "Clínica CNPJ",
        endereco: "Av. B, 2",
        tipoDocumento: "cnpj",
        documento: CNPJ_VALIDO,
      },
      admin: {
        nome: "Admin",
        email: "admin@cnpj.com",
        senha: "senha-segura",
      },
    });

    expect(clinica.documento.tipo).toBe("cnpj");
    expect(clinica.documento.valor).toBe(CNPJ_VALIDO);
  });

  it("rejeita documento fiscal já usado por outra clínica", async () => {
    const { sut } = criarSut();
    const input = {
      clinica: {
        nome: "Primeira",
        endereco: "Rua 1",
        tipoDocumento: "cpf" as const,
        documento: CPF_VALIDO,
      },
      admin: {
        nome: "A",
        email: "a@x.com",
        senha: "senha-segura",
      },
    };

    await sut.executar(input);

    await expect(
      sut.executar({
        ...input,
        clinica: { ...input.clinica, nome: "Segunda" },
        admin: { ...input.admin, email: "b@x.com" },
      }),
    ).rejects.toBeInstanceOf(DocumentoClinicaDuplicadoError);
  });

  it("rejeita e-mail já vinculado a outra clínica", async () => {
    const { sut } = criarSut();

    await sut.executar({
      clinica: {
        nome: "Uma",
        endereco: "Rua 1",
        tipoDocumento: "cpf",
        documento: CPF_VALIDO,
      },
      admin: {
        nome: "Ana",
        email: "mesmo@email.com",
        senha: "senha-segura",
      },
    });

    await expect(
      sut.executar({
        clinica: {
          nome: "Outra",
          endereco: "Rua 2",
          tipoDocumento: "cnpj",
          documento: CNPJ_VALIDO,
        },
        admin: {
          nome: "Outro",
          email: "mesmo@email.com",
          senha: "outra-senha",
        },
      }),
    ).rejects.toBeInstanceOf(UsuarioJaVinculadoAClinicaError);
  });
});
