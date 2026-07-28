import { describe, expect, it } from "vitest";

import { TenantMismatchError } from "../../domain/errors";
import type { Papel } from "../../domain/Papel";
import { Profissional } from "../../domain/Profissional";
import {
  FakeAuthPort,
  FakeProfissionalRepository,
} from "../test-doubles/fakes";
import { ListarMembrosDaClinica } from "./ListarMembrosDaClinica";

async function seed(papelSolicitante: Papel) {
  const profissionalRepo = new FakeProfissionalRepository();
  const auth = new FakeAuthPort();

  const solicitanteUser = await auth.criarUsuario({
    nome: "Solicitante",
    email: `${papelSolicitante}@c.com`,
    senha: "s",
  });
  const solicitante = Profissional.criar({
    id: "prof-solicitante",
    clinicaId: "clinica-1",
    usuarioId: solicitanteUser.id,
    nome: "Solicitante",
    papel: papelSolicitante,
    cro: papelSolicitante === "dentista" ? "1" : null,
  });
  await profissionalRepo.salvar(solicitante);

  const outroUser = await auth.criarUsuario({
    nome: "Outro",
    email: "outro@c.com",
    senha: "s",
  });
  await profissionalRepo.salvar(
    Profissional.criar({
      id: "prof-outro",
      clinicaId: "clinica-1",
      usuarioId: outroUser.id,
      nome: "Outro",
      papel: "recepcao",
    }),
  );

  // Membro de outra clínica — não deve vazar
  const invasorUser = await auth.criarUsuario({
    nome: "Invasor",
    email: "invasor@c.com",
    senha: "s",
  });
  await profissionalRepo.salvar(
    Profissional.criar({
      id: "prof-invasor",
      clinicaId: "clinica-outra",
      usuarioId: invasorUser.id,
      nome: "Invasor",
      papel: "admin",
    }),
  );

  auth.definirSessao({
    usuarioId: solicitanteUser.id,
    clinicaId: "clinica-1",
    papel: papelSolicitante,
    profissionalId: solicitante.id,
  });

  const sut = new ListarMembrosDaClinica(profissionalRepo, auth);
  return { sut, solicitanteUser };
}

describe("ListarMembrosDaClinica", () => {
  it.each(["admin", "dentista", "recepcao"] as const)(
    "%s pode listar apenas membros da própria clínica",
    async (papel) => {
      const { sut, solicitanteUser } = await seed(papel);

      const membros = await sut.executar({
        clinicaId: "clinica-1",
        solicitadoPorUsuarioId: solicitanteUser.id,
      });

      expect(membros).toHaveLength(2);
      expect(membros.every((m) => m.clinicaId === "clinica-1")).toBe(true);
      expect(membros.some((m) => m.id === "prof-invasor")).toBe(false);
    },
  );

  it("rejeita listagem com clinicaId diferente da sessão (isolamento de tenant)", async () => {
    const { sut, solicitanteUser } = await seed("admin");

    await expect(
      sut.executar({
        clinicaId: "clinica-outra",
        solicitadoPorUsuarioId: solicitanteUser.id,
      }),
    ).rejects.toBeInstanceOf(TenantMismatchError);
  });
});
