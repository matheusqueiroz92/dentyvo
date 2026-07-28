import { describe, expect, it } from "vitest";

import { PermissaoNegadaError } from "@/core/shared/errors";

import { Agendamento } from "../../domain/Agendamento";
import {
  ForaDaDisponibilidadeError,
  SobreposicaoHorarioError,
} from "../../domain/errors";
import { LEMBRETE_ANTECEDENCIA_PADRAO_MS } from "../../domain/constants";
import { MarcarConsulta } from "./MarcarConsulta";
import { seedContextoAgendamento, segundaAs } from "./helpers-test";

function sutDe(ctx: Awaited<ReturnType<typeof seedContextoAgendamento>>) {
  return new MarcarConsulta(
    ctx.agendamentoRepo,
    ctx.disponibilidadeRepo,
    ctx.procedimentoRepo,
    ctx.pacienteRepo,
    ctx.profissionalRepo,
    ctx.lembrete,
  );
}

describe("MarcarConsulta", () => {
  it.each(["admin", "dentista", "recepcao"] as const)(
    "%s pode marcar consulta que bloqueia o horário (pendente)",
    async (papel) => {
      const ctx = await seedContextoAgendamento(papel);
      const sut = sutDe(ctx);

      const agendamento = await sut.executar({
        clinicaId: ctx.clinicaId,
        solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
        pacienteId: ctx.pacienteId,
        profissionalId: ctx.profissionalId,
        procedimentoId: ctx.procedimentoId,
        dataHoraInicio: segundaAs(9),
        origem: "painel",
      });

      expect(agendamento.status).toBe("pendente");
      expect(agendamento.origem).toBe("painel");
      expect(agendamento.dataHoraFim.getTime()).toBe(segundaAs(10).getTime());
      expect(
        await ctx.agendamentoRepo.buscarPorId(ctx.clinicaId, agendamento.id),
      ).not.toBeNull();
    },
  );

  it("usa duração do procedimento quando não informada e registra lembrete 24h antes", async () => {
    const ctx = await seedContextoAgendamento("recepcao");
    const sut = sutDe(ctx);
    const inicio = segundaAs(9);

    const agendamento = await sut.executar({
      clinicaId: ctx.clinicaId,
      solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
      pacienteId: ctx.pacienteId,
      profissionalId: ctx.profissionalId,
      procedimentoId: ctx.procedimentoId,
      dataHoraInicio: inicio,
      origem: "painel",
    });

    expect(agendamento.dataHoraFim.getTime() - inicio.getTime()).toBe(
      60 * 60_000,
    );
    expect(ctx.lembrete.intencoes).toHaveLength(1);
    expect(ctx.lembrete.intencoes[0]?.dataHoraEnvioPrevisto.getTime()).toBe(
      inicio.getTime() - LEMBRETE_ANTECEDENCIA_PADRAO_MS,
    );
  });

  it("não permite marcar com interseção (1 min) para o mesmo profissional", async () => {
    const ctx = await seedContextoAgendamento("recepcao");
    const sut = sutDe(ctx);

    await sut.executar({
      clinicaId: ctx.clinicaId,
      solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
      pacienteId: ctx.pacienteId,
      profissionalId: ctx.profissionalId,
      procedimentoId: ctx.procedimentoId,
      dataHoraInicio: segundaAs(9),
      origem: "painel",
      duracaoMinutos: 60,
    });

    await expect(
      sut.executar({
        clinicaId: ctx.clinicaId,
        solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
        pacienteId: ctx.pacienteId,
        profissionalId: ctx.profissionalId,
        procedimentoId: ctx.procedimentoId,
        dataHoraInicio: segundaAs(9, 59),
        origem: "link-publico",
        duracaoMinutos: 30,
      }),
    ).rejects.toBeInstanceOf(SobreposicaoHorarioError);
  });

  it("permite marcar contíguo (fim do anterior = início do novo)", async () => {
    const ctx = await seedContextoAgendamento("recepcao");
    const sut = sutDe(ctx);

    await sut.executar({
      clinicaId: ctx.clinicaId,
      solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
      pacienteId: ctx.pacienteId,
      profissionalId: ctx.profissionalId,
      procedimentoId: ctx.procedimentoId,
      dataHoraInicio: segundaAs(9),
      origem: "painel",
      duracaoMinutos: 60,
    });

    const segundo = await sut.executar({
      clinicaId: ctx.clinicaId,
      solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
      pacienteId: ctx.pacienteId,
      profissionalId: ctx.profissionalId,
      procedimentoId: ctx.procedimentoId,
      dataHoraInicio: segundaAs(10),
      origem: "painel",
      duracaoMinutos: 60,
    });

    expect(segundo.dataHoraInicio.getTime()).toBe(segundaAs(10).getTime());
  });

  it("bloqueia agendar fora da janela de disponibilidade (buraco de almoço)", async () => {
    const ctx = await seedContextoAgendamento("recepcao");
    const sut = sutDe(ctx);

    await expect(
      sut.executar({
        clinicaId: ctx.clinicaId,
        solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
        pacienteId: ctx.pacienteId,
        profissionalId: ctx.profissionalId,
        procedimentoId: ctx.procedimentoId,
        dataHoraInicio: segundaAs(12),
        origem: "painel",
        duracaoMinutos: 60,
      }),
    ).rejects.toBeInstanceOf(ForaDaDisponibilidadeError);
  });

  it("falha do lembrete não desfaz o agendamento (best-effort)", async () => {
    const ctx = await seedContextoAgendamento("recepcao");
    ctx.lembrete.falharProximo = true;
    const sut = sutDe(ctx);

    const agendamento = await sut.executar({
      clinicaId: ctx.clinicaId,
      solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
      pacienteId: ctx.pacienteId,
      profissionalId: ctx.profissionalId,
      procedimentoId: ctx.procedimentoId,
      dataHoraInicio: segundaAs(9),
      origem: "painel",
    });

    expect(
      await ctx.agendamentoRepo.buscarPorId(ctx.clinicaId, agendamento.id),
    ).not.toBeNull();
    expect(ctx.lembrete.intencoes).toHaveLength(0);
  });

  it("cancelado não impede novo agendamento no mesmo horário", async () => {
    const ctx = await seedContextoAgendamento("recepcao");
    await ctx.agendamentoRepo.salvar(
      Agendamento.criar({
        id: "ag-cancelado",
        clinicaId: ctx.clinicaId,
        pacienteId: ctx.pacienteId,
        profissionalId: ctx.profissionalId,
        procedimentoId: ctx.procedimentoId,
        dataHoraInicio: segundaAs(9),
        duracaoMinutos: 60,
        origem: "painel",
      }).cancelar("desistiu"),
    );

    const sut = sutDe(ctx);
    const novo = await sut.executar({
      clinicaId: ctx.clinicaId,
      solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
      pacienteId: ctx.pacienteId,
      profissionalId: ctx.profissionalId,
      procedimentoId: ctx.procedimentoId,
      dataHoraInicio: segundaAs(9),
      origem: "painel",
    });

    expect(novo.status).toBe("pendente");
  });

  it("nega marcação quando solicitante não está vinculado à clínica", async () => {
    const ctx = await seedContextoAgendamento("recepcao");
    const sut = sutDe(ctx);

    await expect(
      sut.executar({
        clinicaId: ctx.clinicaId,
        solicitadoPorUsuarioId: "usuario-fantasma",
        pacienteId: ctx.pacienteId,
        profissionalId: ctx.profissionalId,
        procedimentoId: ctx.procedimentoId,
        dataHoraInicio: segundaAs(9),
        origem: "painel",
      }),
    ).rejects.toBeInstanceOf(PermissaoNegadaError);
  });
});
