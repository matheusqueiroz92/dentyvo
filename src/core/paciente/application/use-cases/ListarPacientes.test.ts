import { describe, expect, it } from "vitest";

import { Paciente } from "../../domain/Paciente";
import { CPF_VALIDO_PACIENTE } from "../test-doubles/fakes";
import { ListarPacientes } from "./ListarPacientes";
import { seedSolicitante } from "./helpers-test";

describe("ListarPacientes", () => {
  it("lista apenas pacientes da clínica da sessão", async () => {
    const ctx = await seedSolicitante("dentista");
    await ctx.pacienteRepo.salvar(
      Paciente.criar({
        id: "pac-1",
        clinicaId: ctx.clinicaId,
        nome: "Da casa",
        cpf: CPF_VALIDO_PACIENTE,
        telefone: "77911112222",
        dataNascimento: new Date("1990-01-01T12:00:00.000Z"),
      }),
    );
    await ctx.pacienteRepo.salvar(
      Paciente.criar({
        id: "pac-2",
        clinicaId: "clinica-outra",
        nome: "De fora",
        cpf: "52998224725",
        telefone: "77911113333",
        dataNascimento: new Date("1992-01-01T12:00:00.000Z"),
      }),
    );

    const sut = new ListarPacientes(ctx.pacienteRepo, ctx.profissionalRepo);
    const lista = await sut.executar({
      clinicaId: ctx.clinicaId,
      solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
    });

    expect(lista).toHaveLength(1);
    expect(lista[0]?.id).toBe("pac-1");
  });
});
