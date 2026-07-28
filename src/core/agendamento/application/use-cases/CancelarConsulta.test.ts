import { describe, expect, it } from "vitest";

import { Agendamento } from "../../domain/Agendamento";
import { CancelarConsulta } from "./CancelarConsulta";
import { seedContextoAgendamento, segundaAs } from "./helpers-test";

describe("CancelarConsulta", () => {
  it("cancela, registra motivo opcional e libera o horário", async () => {
    const ctx = await seedContextoAgendamento("recepcao");
    const agendamento = Agendamento.criar({
      id: "ag-1",
      clinicaId: ctx.clinicaId,
      pacienteId: ctx.pacienteId,
      profissionalId: ctx.profissionalId,
      procedimentoId: ctx.procedimentoId,
      dataHoraInicio: segundaAs(9),
      duracaoMinutos: 60,
      origem: "painel",
    });
    await ctx.agendamentoRepo.salvarOcupandoSlot(agendamento);

    const sut = new CancelarConsulta(
      ctx.agendamentoRepo,
      ctx.profissionalRepo,
    );
    await sut.executar({
      clinicaId: ctx.clinicaId,
      solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
      agendamentoId: agendamento.id,
      motivo: "paciente desmarcou",
    });

    const atual = await ctx.agendamentoRepo.buscarPorId(
      ctx.clinicaId,
      agendamento.id,
    );
    expect(atual?.status).toBe("cancelado");
    expect(atual?.motivoCancelamento).toBe("paciente desmarcou");
    expect(atual?.ocupaSlot()).toBe(false);

    const ocupados =
      await ctx.agendamentoRepo.listarOcupadosPorProfissionalNoIntervalo(
        ctx.clinicaId,
        ctx.profissionalId,
        segundaAs(9),
        segundaAs(10),
      );
    expect(ocupados).toHaveLength(0);
  });
});
