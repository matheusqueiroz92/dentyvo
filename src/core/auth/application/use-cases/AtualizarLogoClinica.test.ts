import { describe, expect, it } from "vitest";

import { PermissaoNegadaError, TenantMismatchError } from "../../domain/errors";
import { Clinica } from "../../domain/Clinica";
import { DocumentoFiscal } from "../../domain/DocumentoFiscal";
import type { Papel } from "../../domain/Papel";
import { Profissional } from "../../domain/Profissional";
import {
  FakeAuthPort,
  FakeClinicaRepository,
  FakeProfissionalRepository,
} from "../test-doubles/fakes";
import { AtualizarLogoClinica } from "./AtualizarLogoClinica";

const LOGO_URL = "https://blob.vercel-storage.com/clinicas/cli-1/logo.png";

async function seed(papel: Papel) {
  const clinicaRepo = new FakeClinicaRepository();
  const profissionalRepo = new FakeProfissionalRepository();
  const auth = new FakeAuthPort();

  const clinica = Clinica.criar({
    id: "clinica-1",
    nome: "Clínica Um",
    endereco: "Rua A, 1",
    documento: DocumentoFiscal.criar("cpf", "39053344705"),
  });
  await clinicaRepo.salvar(clinica);

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
  const profissional = Profissional.criar({
    id: `prof-${papel}`,
    clinicaId: "clinica-1",
    usuarioId: usuario.id,
    nome: `User ${papel}`,
    papel,
    cro: papel === "dentista" ? "12345" : null,
  });
  await profissionalRepo.salvar(profissional);

  const sut = new AtualizarLogoClinica(clinicaRepo, profissionalRepo);
  return { sut, clinicaRepo, usuario };
}

describe("AtualizarLogoClinica", () => {
  it("admin define logoUrl da própria clínica", async () => {
    const { sut, clinicaRepo, usuario } = await seed("admin");

    const atualizada = await sut.executar({
      clinicaId: "clinica-1",
      solicitadoPorUsuarioId: usuario.id,
      logoUrl: LOGO_URL,
    });

    expect(atualizada.logoUrl).toBe(LOGO_URL);
    expect((await clinicaRepo.buscarPorId("clinica-1"))?.logoUrl).toBe(
      LOGO_URL,
    );
  });

  it("admin remove logo com logoUrl null", async () => {
    const { sut, clinicaRepo, usuario } = await seed("admin");
    await clinicaRepo.salvar(
      (await clinicaRepo.buscarPorId("clinica-1"))!.atualizarLogo(LOGO_URL),
    );

    const atualizada = await sut.executar({
      clinicaId: "clinica-1",
      solicitadoPorUsuarioId: usuario.id,
      logoUrl: null,
    });

    expect(atualizada.logoUrl).toBeNull();
    expect((await clinicaRepo.buscarPorId("clinica-1"))?.logoUrl).toBeNull();
  });

  it.each(["dentista", "recepcao"] as const)(
    "%s não pode atualizar logo",
    async (papel) => {
      const { sut, usuario } = await seed(papel);

      await expect(
        sut.executar({
          clinicaId: "clinica-1",
          solicitadoPorUsuarioId: usuario.id,
          logoUrl: LOGO_URL,
        }),
      ).rejects.toBeInstanceOf(PermissaoNegadaError);
    },
  );

  it("não atualiza logo de outra clínica (isolamento de tenant)", async () => {
    const { sut, clinicaRepo, usuario } = await seed("admin");

    await expect(
      sut.executar({
        clinicaId: "clinica-outra",
        solicitadoPorUsuarioId: usuario.id,
        logoUrl: LOGO_URL,
      }),
    ).rejects.toBeInstanceOf(TenantMismatchError);

    expect((await clinicaRepo.buscarPorId("clinica-outra"))?.logoUrl).toBeNull();
  });
});
