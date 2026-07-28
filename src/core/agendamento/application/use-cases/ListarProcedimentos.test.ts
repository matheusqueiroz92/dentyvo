import { describe, expect, it } from "vitest";

import { Procedimento } from "../../domain/Procedimento";
import { ListarProcedimentos } from "./ListarProcedimentos";
import { seedContextoAgendamento } from "./helpers-test";

describe("ListarProcedimentos", () => {
  it("lista apenas procedimentos da clínica da sessão", async () => {
    const ctx = await seedContextoAgendamento("admin");
    await ctx.procedimentoRepo.salvar(
      Procedimento.criar({
        id: "proc-outro",
        clinicaId: "clinica-outra",
        nome: "De fora",
        duracaoPadraoMinutos: 30,
        valor: 0,
      }),
    );

    const sut = new ListarProcedimentos(
      ctx.procedimentoRepo,
      ctx.profissionalRepo,
    );
    const lista = await sut.executar({
      clinicaId: ctx.clinicaId,
      solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
    });

    expect(lista.every((p) => p.clinicaId === ctx.clinicaId)).toBe(true);
    expect(lista.some((p) => p.id === "proc-outro")).toBe(false);
  });
});
