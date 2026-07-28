import { describe, expect, it } from "vitest";

import { Clinica } from "../../domain/Clinica";
import { CONVITE_TTL_MS } from "../../domain/constants";
import { DocumentoFiscal } from "../../domain/DocumentoFiscal";
import {
  PermissaoNegadaError,
  UsuarioJaVinculadoAClinicaError,
} from "../../domain/errors";
import type { Papel } from "../../domain/Papel";
import { Profissional } from "../../domain/Profissional";
import {
  CPF_VALIDO,
  FakeAuthPort,
  FakeClinicaRepository,
  FakeConviteRepository,
  FakeEmailPort,
  FakeProfissionalRepository,
} from "../test-doubles/fakes";
import { ConvidarUsuario } from "./ConvidarUsuario";

async function seedClinicaComMembro(papel: Papel) {
  const clinicaRepo = new FakeClinicaRepository();
  const profissionalRepo = new FakeProfissionalRepository();
  const conviteRepo = new FakeConviteRepository();
  const auth = new FakeAuthPort();
  const email = new FakeEmailPort();

  const clinica = Clinica.criar({
    id: "clinica-1",
    nome: "Clínica Teste",
    endereco: "Rua A",
    documento: DocumentoFiscal.criar("cpf", CPF_VALIDO),
  });
  await clinicaRepo.salvar(clinica);

  const usuario = await auth.criarUsuario({
    nome: "Membro",
    email: `${papel}@clinica.com`,
    senha: "senha",
  });

  const profissional = Profissional.criar({
    id: `prof-${papel}`,
    clinicaId: clinica.id,
    usuarioId: usuario.id,
    nome: "Membro",
    papel,
    cro: papel === "dentista" ? "123" : null,
  });
  await profissionalRepo.salvar(profissional);

  auth.definirSessao({
    usuarioId: usuario.id,
    clinicaId: clinica.id,
    papel,
    profissionalId: profissional.id,
  });

  const sut = new ConvidarUsuario(
    conviteRepo,
    profissionalRepo,
    clinicaRepo,
    auth,
    email,
  );

  return {
    sut,
    clinica,
    profissional,
    usuario,
    conviteRepo,
    email,
    auth,
    profissionalRepo,
  };
}

describe("ConvidarUsuario", () => {
  it.each(["admin", "dentista", "recepcao"] as const)(
    "admin pode convidar papel %s e envia e-mail com token de 72h",
    async (papelConvidado) => {
      const { sut, clinica, usuario, conviteRepo, email } =
        await seedClinicaComMembro("admin");

      const antes = Date.now();
      const convite = await sut.executar({
        clinicaId: clinica.id,
        email: `${papelConvidado}-novo@email.com`,
        papel: papelConvidado,
        convidadoPorUsuarioId: usuario.id,
      });
      const depois = Date.now();

      expect(convite.papel).toBe(papelConvidado);
      // Expiração = instante de criação + 72h
      expect(convite.expiresAt.getTime()).toBeGreaterThanOrEqual(
        antes + CONVITE_TTL_MS,
      );
      expect(convite.expiresAt.getTime()).toBeLessThanOrEqual(
        depois + CONVITE_TTL_MS,
      );

      expect(await conviteRepo.buscarPorToken(convite.token)).not.toBeNull();
      expect(email.enviados).toHaveLength(1);
      expect(email.enviados[0]?.para).toBe(`${papelConvidado}-novo@email.com`);
      expect(email.enviados[0]?.token).toBe(convite.token);
    },
  );

  it("dentista não pode convidar ninguém", async () => {
    const { sut, clinica, usuario } = await seedClinicaComMembro("dentista");

    await expect(
      sut.executar({
        clinicaId: clinica.id,
        email: "alguem@email.com",
        papel: "recepcao",
        convidadoPorUsuarioId: usuario.id,
      }),
    ).rejects.toBeInstanceOf(PermissaoNegadaError);
  });

  it("recepção não pode convidar ninguém", async () => {
    const { sut, clinica, usuario } = await seedClinicaComMembro("recepcao");

    await expect(
      sut.executar({
        clinicaId: clinica.id,
        email: "alguem@email.com",
        papel: "dentista",
        convidadoPorUsuarioId: usuario.id,
      }),
    ).rejects.toBeInstanceOf(PermissaoNegadaError);
  });

  it("não convida e-mail já vinculado a uma clínica", async () => {
    const { sut, clinica, usuario, auth, profissionalRepo } =
      await seedClinicaComMembro("admin");

    const outro = await auth.criarUsuario({
      nome: "Já vinculado",
      email: "vinculado@email.com",
      senha: "senha",
    });
    await profissionalRepo.salvar(
      Profissional.criar({
        id: "prof-outro",
        clinicaId: clinica.id,
        usuarioId: outro.id,
        nome: "Já vinculado",
        papel: "recepcao",
      }),
    );

    await expect(
      sut.executar({
        clinicaId: clinica.id,
        email: "vinculado@email.com",
        papel: "dentista",
        convidadoPorUsuarioId: usuario.id,
      }),
    ).rejects.toBeInstanceOf(UsuarioJaVinculadoAClinicaError);
  });
});
