import { describe, expect, it } from "vitest";

import { Agendamento } from "../../domain/Agendamento";
import { ListarHorariosDisponiveis } from "./ListarHorariosDisponiveis";
import { seedContextoAgendamento, segundaAs } from "./helpers-test";

describe("ListarHorariosDisponiveis", () => {
  it("lista slots livres respeitando janelas e ocupações", async () => {
    const ctx = await seedContextoAgendamento("recepcao");
    await ctx.agendamentoRepo.salvarOcupandoSlot(
      Agendamento.criar({
        id: "ag-1",
        clinicaId: ctx.clinicaId,
        pacienteId: ctx.pacienteId,
        profissionalId: ctx.profissionalId,
        procedimentoId: ctx.procedimentoId,
        dataHoraInicio: segundaAs(9),
        duracaoMinutos: 60,
        origem: "painel",
      }),
    );

    const sut = new ListarHorariosDisponiveis(
      ctx.disponibilidadeRepo,
      ctx.agendamentoRepo,
      ctx.profissionalRepo,
    );

    const horarios = await sut.executar({
      clinicaId: ctx.clinicaId,
      solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
      profissionalId: ctx.profissionalId,
      data: segundaAs(0),
    });

    expect(horarios.length).toBeGreaterThan(0);
    expect(
      horarios.some(
        (h) =>
          h.inicio.getTime() === segundaAs(9).getTime() &&
          h.fim.getTime() === segundaAs(10).getTime(),
      ),
    ).toBe(false);
    expect(
      horarios.some((h) => h.inicio.getTime() === segundaAs(8).getTime()),
    ).toBe(true);
    expect(
      horarios.some((h) => h.inicio.getTime() === segundaAs(14).getTime()),
    ).toBe(true);
    // buraco de almoço não aparece
    expect(
      horarios.some((h) => h.inicio.getTime() === segundaAs(12).getTime()),
    ).toBe(false);
  });
});
