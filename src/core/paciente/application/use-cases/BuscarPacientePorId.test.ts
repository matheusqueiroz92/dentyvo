import { describe, expect, it } from "vitest";

import { Paciente } from "../../domain/Paciente";
import { PacienteNaoEncontradoError } from "../../domain/errors";
import { CPF_VALIDO_PACIENTE } from "../test-doubles/fakes";
import { BuscarPacientePorId } from "./BuscarPacientePorId";
import { seedSolicitante } from "./helpers-test";

describe("BuscarPacientePorId", () => {
  it("retorna paciente da própria clínica", async () => {
    const ctx = await seedSolicitante("recepcao");
    const paciente = Paciente.criar({
      id: "pac-1",
      clinicaId: ctx.clinicaId,
      nome: "Ana",
      cpf: CPF_VALIDO_PACIENTE,
      telefone: "77999990000",
      dataNascimento: new Date("1991-01-01T12:00:00.000Z"),
    });
    await ctx.pacienteRepo.salvar(paciente);

    const sut = new BuscarPacientePorId(
      ctx.pacienteRepo,
      ctx.profissionalRepo,
    );
    const encontrado = await sut.executar({
      clinicaId: ctx.clinicaId,
      solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
      pacienteId: paciente.id,
    });

    expect(encontrado.id).toBe(paciente.id);
  });

  it("não vaza paciente de outra clínica (resultado como não encontrado)", async () => {
    const ctx = await seedSolicitante("admin");
    const deOutra = Paciente.criar({
      id: "pac-outro",
      clinicaId: "clinica-outra",
      nome: "Outro",
      cpf: CPF_VALIDO_PACIENTE,
      telefone: "77999990001",
      dataNascimento: new Date("1991-01-01T12:00:00.000Z"),
    });
    await ctx.pacienteRepo.salvar(deOutra);

    const sut = new BuscarPacientePorId(
      ctx.pacienteRepo,
      ctx.profissionalRepo,
    );

    await expect(
      sut.executar({
        clinicaId: ctx.clinicaId,
        solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
        pacienteId: deOutra.id,
      }),
    ).rejects.toBeInstanceOf(PacienteNaoEncontradoError);
  });
});
