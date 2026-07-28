import { describe, expect, it } from "vitest";

import { Agendamento } from "../../domain/Agendamento";
import { TransicaoStatusInvalidaError } from "../../domain/errors";
import { ConfirmarConsulta } from "./ConfirmarConsulta";
import { seedContextoAgendamento, segundaAs } from "./helpers-test";

describe("ConfirmarConsulta", () => {
  it.each(["admin", "dentista", "recepcao"] as const)(
    "%s pode confirmar consulta pendente",
    async (papel) => {
      const ctx = await seedContextoAgendamento(papel);
      const agendamento = Agendamento.criar({
        id: "ag-1",
        clinicaId: ctx.clinicaId,
        pacienteId: ctx.pacienteId,
        profissionalId: ctx.profissionalId,
        procedimentoId: ctx.procedimentoId,
        dataHoraInicio: segundaAs(9),
        duracaoMinutos: 60,
        origem: "whatsapp-bot",
      });
      await ctx.agendamentoRepo.salvarOcupandoSlot(agendamento);

      const sut = new ConfirmarConsulta(
        ctx.agendamentoRepo,
        ctx.profissionalRepo,
      );
      const confirmado = await sut.executar({
        clinicaId: ctx.clinicaId,
        solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
        agendamentoId: agendamento.id,
      });

      expect(confirmado.status).toBe("confirmado");
      expect(confirmado.origem).toBe("whatsapp-bot");
    },
  );

  it("não confirma agendamento que não está pendente", async () => {
    const ctx = await seedContextoAgendamento("recepcao");
    const jaConfirmado = Agendamento.criar({
      id: "ag-1",
      clinicaId: ctx.clinicaId,
      pacienteId: ctx.pacienteId,
      profissionalId: ctx.profissionalId,
      procedimentoId: ctx.procedimentoId,
      dataHoraInicio: segundaAs(9),
      duracaoMinutos: 60,
      origem: "painel",
    }).confirmar();
    await ctx.agendamentoRepo.salvarOcupandoSlot(jaConfirmado);

    const sut = new ConfirmarConsulta(
      ctx.agendamentoRepo,
      ctx.profissionalRepo,
    );

    await expect(
      sut.executar({
        clinicaId: ctx.clinicaId,
        solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
        agendamentoId: jaConfirmado.id,
      }),
    ).rejects.toBeInstanceOf(TransicaoStatusInvalidaError);
  });
});
