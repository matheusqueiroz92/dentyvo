import { describe, expect, it } from "vitest";

import { Procedimento } from "../../domain/Procedimento";
import { ProcedimentoNaoEncontradoError } from "../../domain/errors";
import { BuscarProcedimentoPorId } from "./BuscarProcedimentoPorId";
import { seedContextoAgendamento } from "./helpers-test";

describe("BuscarProcedimentoPorId", () => {
  it("retorna procedimento da clínica e não vaza de outro tenant", async () => {
    const ctx = await seedContextoAgendamento("dentista");
    await ctx.procedimentoRepo.salvar(
      Procedimento.criar({
        id: "proc-outro",
        clinicaId: "clinica-outra",
        nome: "Outro",
        duracaoPadraoMinutos: 30,
        valor: 0,
      }),
    );

    const sut = new BuscarProcedimentoPorId(
      ctx.procedimentoRepo,
      ctx.profissionalRepo,
    );

    const daCasa = await sut.executar({
      clinicaId: ctx.clinicaId,
      solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
      procedimentoId: ctx.procedimentoId,
    });
    expect(daCasa.id).toBe(ctx.procedimentoId);

    await expect(
      sut.executar({
        clinicaId: ctx.clinicaId,
        solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
        procedimentoId: "proc-outro",
      }),
    ).rejects.toBeInstanceOf(ProcedimentoNaoEncontradoError);
  });
});
