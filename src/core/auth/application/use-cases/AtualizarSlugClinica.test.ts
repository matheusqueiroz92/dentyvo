import { describe, expect, it } from "vitest";

import { Clinica } from "../../domain/Clinica";
import { DocumentoFiscal } from "../../domain/DocumentoFiscal";
import type { Papel } from "../../domain/Papel";
import { Profissional } from "../../domain/Profissional";
import {
  FakeAuthPort,
  FakeClinicaRepository,
  FakeProfissionalRepository,
} from "../test-doubles/fakes";
import { AtualizarSlugClinica } from "./AtualizarSlugClinica";

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

  const sut = new AtualizarSlugClinica(clinicaRepo, profissionalRepo);
  return { sut, clinicaRepo, usuario };
}

describe("AtualizarSlugClinica", () => {
  it("não reverte nome alterado concorrentemente ao atualizar só o slug", async () => {
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
      slug: "clinica-um-nova",
    });

    const persistida = await buscarOriginal("clinica-1");
    expect(persistida?.slug).toBe("clinica-um-nova");
    expect(persistida?.nome).toBe("Nome Concorrente");
  });
});
