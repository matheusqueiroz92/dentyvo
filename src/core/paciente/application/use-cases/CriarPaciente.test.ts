import { describe, expect, it } from "vitest";

import { PermissaoNegadaError, TenantMismatchError } from "@/core/shared/errors";

import {
  CPF_VALIDO_PACIENTE,
  FakePacienteRepository,
} from "../test-doubles/fakes";
import { CriarPaciente } from "./CriarPaciente";
import { seedSolicitante } from "./helpers-test";

const nascimento = new Date("1990-05-15T12:00:00.000Z");

describe("CriarPaciente", () => {
  it.each(["admin", "dentista", "recepcao"] as const)(
    "%s pode cadastrar paciente na própria clínica",
    async (papel) => {
      const ctx = await seedSolicitante(papel);
      const sut = new CriarPaciente(ctx.pacienteRepo, ctx.profissionalRepo);

      const paciente = await sut.executar({
        clinicaId: ctx.clinicaId,
        solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
        nome: "Maria Silva",
        cpf: CPF_VALIDO_PACIENTE,
        telefone: "77988887777",
        dataNascimento: nascimento,
      });

      expect(paciente.clinicaId).toBe(ctx.clinicaId);
      expect(paciente.nome).toBe("Maria Silva");
      expect(
        await ctx.pacienteRepo.buscarPorId(ctx.clinicaId, paciente.id),
      ).not.toBeNull();
    },
  );

  it("não permite criar paciente em clínica diferente da do solicitante", async () => {
    const ctx = await seedSolicitante("admin");
    const sut = new CriarPaciente(ctx.pacienteRepo, ctx.profissionalRepo);

    await expect(
      sut.executar({
        clinicaId: "outra-clinica",
        solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
        nome: "Maria",
        cpf: CPF_VALIDO_PACIENTE,
        telefone: "77988887777",
        dataNascimento: nascimento,
      }),
    ).rejects.toBeInstanceOf(TenantMismatchError);
  });

  it("nega criação quando o solicitante não tem vínculo profissional", async () => {
    const pacienteRepo = new FakePacienteRepository();
    const ctx = await seedSolicitante("admin");
    const sut = new CriarPaciente(pacienteRepo, ctx.profissionalRepo);

    await expect(
      sut.executar({
        clinicaId: ctx.clinicaId,
        solicitadoPorUsuarioId: "usuario-inexistente",
        nome: "Maria",
        cpf: CPF_VALIDO_PACIENTE,
        telefone: "77988887777",
        dataNascimento: nascimento,
      }),
    ).rejects.toBeInstanceOf(PermissaoNegadaError);
  });
});
