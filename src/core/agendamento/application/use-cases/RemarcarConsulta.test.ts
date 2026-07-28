import { describe, expect, it } from "vitest";

import { Agendamento } from "../../domain/Agendamento";
import {
  ForaDaDisponibilidadeError,
  SobreposicaoHorarioError,
} from "../../domain/errors";
import { RemarcarConsulta } from "./RemarcarConsulta";
import { seedContextoAgendamento, segundaAs } from "./helpers-test";

describe("RemarcarConsulta", () => {
  it("libera o horário anterior e ocupa o novo de forma atômica", async () => {
    const ctx = await seedContextoAgendamento("recepcao");
    const original = Agendamento.criar({
      id: "ag-1",
      clinicaId: ctx.clinicaId,
      pacienteId: ctx.pacienteId,
      profissionalId: ctx.profissionalId,
      procedimentoId: ctx.procedimentoId,
      dataHoraInicio: segundaAs(9),
      duracaoMinutos: 60,
      origem: "painel",
    });
    await ctx.agendamentoRepo.salvarOcupandoSlot(original);

    const sut = new RemarcarConsulta(
      ctx.agendamentoRepo,
      ctx.disponibilidadeRepo,
      ctx.profissionalRepo,
      ctx.lembrete,
    );

    const remarcado = await sut.executar({
      clinicaId: ctx.clinicaId,
      solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
      agendamentoId: original.id,
      novaDataHoraInicio: segundaAs(14),
    });

    expect(remarcado.dataHoraInicio.getTime()).toBe(segundaAs(14).getTime());

    const ocupadosManha =
      await ctx.agendamentoRepo.listarOcupadosPorProfissionalNoIntervalo(
        ctx.clinicaId,
        ctx.profissionalId,
        segundaAs(9),
        segundaAs(10),
      );
    expect(ocupadosManha).toHaveLength(0);

    const ocupadosTarde =
      await ctx.agendamentoRepo.listarOcupadosPorProfissionalNoIntervalo(
        ctx.clinicaId,
        ctx.profissionalId,
        segundaAs(14),
        segundaAs(15),
      );
    expect(ocupadosTarde).toHaveLength(1);
  });

  it("não remarca para horário com sobreposição", async () => {
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
    await ctx.agendamentoRepo.salvarOcupandoSlot(
      Agendamento.criar({
        id: "ag-2",
        clinicaId: ctx.clinicaId,
        pacienteId: ctx.pacienteId,
        profissionalId: ctx.profissionalId,
        procedimentoId: ctx.procedimentoId,
        dataHoraInicio: segundaAs(14),
        duracaoMinutos: 60,
        origem: "painel",
      }),
    );

    const sut = new RemarcarConsulta(
      ctx.agendamentoRepo,
      ctx.disponibilidadeRepo,
      ctx.profissionalRepo,
      ctx.lembrete,
    );

    await expect(
      sut.executar({
        clinicaId: ctx.clinicaId,
        solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
        agendamentoId: "ag-1",
        novaDataHoraInicio: segundaAs(14),
      }),
    ).rejects.toBeInstanceOf(SobreposicaoHorarioError);
  });

  it("não remarca para fora da disponibilidade", async () => {
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

    const sut = new RemarcarConsulta(
      ctx.agendamentoRepo,
      ctx.disponibilidadeRepo,
      ctx.profissionalRepo,
      ctx.lembrete,
    );

    await expect(
      sut.executar({
        clinicaId: ctx.clinicaId,
        solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
        agendamentoId: "ag-1",
        novaDataHoraInicio: segundaAs(12),
      }),
    ).rejects.toBeInstanceOf(ForaDaDisponibilidadeError);
  });
});
