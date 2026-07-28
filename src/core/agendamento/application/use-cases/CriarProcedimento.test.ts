import { describe, expect, it } from "vitest";

import { DuracaoInvalidaError } from "../../domain/errors";
import { CriarProcedimento } from "./CriarProcedimento";
import { seedContextoAgendamento } from "./helpers-test";

describe("CriarProcedimento", () => {
  it.each(["admin", "dentista", "recepcao"] as const)(
    "%s pode criar procedimento na clínica",
    async (papel) => {
      const ctx = await seedContextoAgendamento(papel);
      const sut = new CriarProcedimento(
        ctx.procedimentoRepo,
        ctx.profissionalRepo,
      );

      const procedimento = await sut.executar({
        clinicaId: ctx.clinicaId,
        solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
        nome: "Clareamento",
        duracaoPadraoMinutos: 90,
        valor: 500,
      });

      expect(procedimento.nome).toBe("Clareamento");
      expect(
        await ctx.procedimentoRepo.buscarPorId(ctx.clinicaId, procedimento.id),
      ).not.toBeNull();
    },
  );

  it("rejeita duração padrão inválida", async () => {
    const ctx = await seedContextoAgendamento("admin");
    const sut = new CriarProcedimento(
      ctx.procedimentoRepo,
      ctx.profissionalRepo,
    );

    await expect(
      sut.executar({
        clinicaId: ctx.clinicaId,
        solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
        nome: "X",
        duracaoPadraoMinutos: 10,
        valor: 0,
      }),
    ).rejects.toBeInstanceOf(DuracaoInvalidaError);
  });
});
