import { describe, expect, it } from "vitest";

import { PermissaoNegadaError } from "@/core/shared/errors";

import { DefinirDisponibilidadeProfissional } from "./DefinirDisponibilidadeProfissional";
import { seedContextoAgendamento } from "./helpers-test";

describe("DefinirDisponibilidadeProfissional", () => {
  it.each(["admin", "dentista"] as const)(
    "%s pode definir múltiplas janelas semanais (ex. intervalo de almoço)",
    async (papel) => {
      const ctx = await seedContextoAgendamento(papel);
      const sut = new DefinirDisponibilidadeProfissional(
        ctx.disponibilidadeRepo,
        ctx.profissionalRepo,
      );

      const janelas = await sut.executar({
        clinicaId: ctx.clinicaId,
        solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
        profissionalId: ctx.profissionalId,
        janelas: [
          { diaDaSemana: 1, horaInicio: "08:00", horaFim: "12:00" },
          { diaDaSemana: 1, horaInicio: "14:00", horaFim: "18:00" },
        ],
      });

      expect(janelas).toHaveLength(2);
      const salvas = await ctx.disponibilidadeRepo.listarPorProfissional(
        ctx.clinicaId,
        ctx.profissionalId,
      );
      expect(salvas).toHaveLength(2);
    },
  );

  it("recepção não pode definir disponibilidade", async () => {
    const ctx = await seedContextoAgendamento("recepcao");
    const sut = new DefinirDisponibilidadeProfissional(
      ctx.disponibilidadeRepo,
      ctx.profissionalRepo,
    );

    await expect(
      sut.executar({
        clinicaId: ctx.clinicaId,
        solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
        profissionalId: ctx.profissionalId,
        janelas: [{ diaDaSemana: 1, horaInicio: "08:00", horaFim: "12:00" }],
      }),
    ).rejects.toBeInstanceOf(PermissaoNegadaError);
  });
});
