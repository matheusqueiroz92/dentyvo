import { describe, expect, it } from "vitest";

import { Profissional } from "@/core/auth/domain/Profissional";

import { Agendamento } from "../../domain/Agendamento";
import type { StatusAgendamento } from "../../domain/StatusAgendamento";
import { ListarAgendamentosDoPeriodo } from "./ListarAgendamentosDoPeriodo";
import { seedContextoAgendamento, segundaAs } from "./helpers-test";

function sutDe(ctx: Awaited<ReturnType<typeof seedContextoAgendamento>>) {
  return new ListarAgendamentosDoPeriodo(
    ctx.agendamentoRepo,
    ctx.profissionalRepo,
  );
}

function agendamentoNoPeriodo(
  ctx: Awaited<ReturnType<typeof seedContextoAgendamento>>,
  input: {
    id: string;
    dataHoraInicio: Date;
    status?: StatusAgendamento;
    profissionalId?: string;
    clinicaId?: string;
  },
): Agendamento {
  const status = input.status ?? "pendente";
  return Agendamento.reconstituir({
    id: input.id,
    clinicaId: input.clinicaId ?? ctx.clinicaId,
    pacienteId: ctx.pacienteId,
    profissionalId: input.profissionalId ?? ctx.profissionalId,
    procedimentoId: ctx.procedimentoId,
    dataHoraInicio: input.dataHoraInicio,
    dataHoraFim: new Date(input.dataHoraInicio.getTime() + 60 * 60_000),
    status,
    origem: "painel",
    motivoCancelamento: status === "cancelado" ? "desistiu" : null,
  });
}

describe("ListarAgendamentosDoPeriodo", () => {
  it.each(["admin", "dentista", "recepcao"] as const)(
    "%s pode listar agendamentos do período",
    async (papel) => {
      const ctx = await seedContextoAgendamento(papel);
      await ctx.agendamentoRepo.salvar(
        agendamentoNoPeriodo(ctx, {
          id: "ag-1",
          dataHoraInicio: segundaAs(9),
        }),
      );

      const lista = await sutDe(ctx).executar({
        clinicaId: ctx.clinicaId,
        solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
        dataInicio: segundaAs(8),
        dataFim: segundaAs(12),
      });

      expect(lista.map((a) => a.id)).toEqual(["ag-1"]);
    },
  );

  it("filtra por intervalo half-open [dataInicio, dataFim) em dataHoraInicio", async () => {
    const ctx = await seedContextoAgendamento("recepcao");
    const dataInicio = segundaAs(8);
    const dataFim = segundaAs(12);

    await ctx.agendamentoRepo.salvar(
      agendamentoNoPeriodo(ctx, {
        id: "antes",
        dataHoraInicio: segundaAs(7),
      }),
    );
    await ctx.agendamentoRepo.salvar(
      agendamentoNoPeriodo(ctx, {
        id: "no-inicio",
        dataHoraInicio: dataInicio,
      }),
    );
    await ctx.agendamentoRepo.salvar(
      agendamentoNoPeriodo(ctx, {
        id: "dentro",
        dataHoraInicio: segundaAs(10),
      }),
    );
    await ctx.agendamentoRepo.salvar(
      agendamentoNoPeriodo(ctx, {
        id: "no-fim-excluido",
        dataHoraInicio: dataFim,
      }),
    );

    const lista = await sutDe(ctx).executar({
      clinicaId: ctx.clinicaId,
      solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
      dataInicio,
      dataFim,
    });

    expect(lista.map((a) => a.id)).toEqual(["no-inicio", "dentro"]);
  });

  it("filtra opcionalmente por profissionalId", async () => {
    const ctx = await seedContextoAgendamento("recepcao");
    const outroProfissional = Profissional.criar({
      id: "prof-2",
      clinicaId: ctx.clinicaId,
      usuarioId: "user-dentista-2",
      nome: "Dra. Outra",
      papel: "dentista",
      cro: "88888",
    });
    await ctx.profissionalRepo.salvar(outroProfissional);

    await ctx.agendamentoRepo.salvar(
      agendamentoNoPeriodo(ctx, {
        id: "ag-prof-1",
        dataHoraInicio: segundaAs(9),
        profissionalId: ctx.profissionalId,
      }),
    );
    await ctx.agendamentoRepo.salvar(
      agendamentoNoPeriodo(ctx, {
        id: "ag-prof-2",
        dataHoraInicio: segundaAs(10),
        profissionalId: outroProfissional.id,
      }),
    );

    const filtrada = await sutDe(ctx).executar({
      clinicaId: ctx.clinicaId,
      solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
      dataInicio: segundaAs(8),
      dataFim: segundaAs(12),
      profissionalId: outroProfissional.id,
    });
    expect(filtrada.map((a) => a.id)).toEqual(["ag-prof-2"]);

    const semFiltro = await sutDe(ctx).executar({
      clinicaId: ctx.clinicaId,
      solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
      dataInicio: segundaAs(8),
      dataFim: segundaAs(12),
    });
    expect(semFiltro.map((a) => a.id)).toEqual(["ag-prof-1", "ag-prof-2"]);
  });

  it("ordena por dataHoraInicio ascendente", async () => {
    const ctx = await seedContextoAgendamento("recepcao");
    await ctx.agendamentoRepo.salvar(
      agendamentoNoPeriodo(ctx, {
        id: "tarde",
        dataHoraInicio: segundaAs(11),
      }),
    );
    await ctx.agendamentoRepo.salvar(
      agendamentoNoPeriodo(ctx, {
        id: "manha",
        dataHoraInicio: segundaAs(8),
      }),
    );
    await ctx.agendamentoRepo.salvar(
      agendamentoNoPeriodo(ctx, {
        id: "meio",
        dataHoraInicio: segundaAs(9, 30),
      }),
    );

    const lista = await sutDe(ctx).executar({
      clinicaId: ctx.clinicaId,
      solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
      dataInicio: segundaAs(8),
      dataFim: segundaAs(12),
    });

    expect(lista.map((a) => a.id)).toEqual(["manha", "meio", "tarde"]);
  });

  it("inclui agendamentos de todos os status no período", async () => {
    const ctx = await seedContextoAgendamento("recepcao");
    const statusNoPeriodo: StatusAgendamento[] = [
      "pendente",
      "confirmado",
      "cancelado",
      "realizado",
      "faltou",
    ];

    for (const [indice, status] of statusNoPeriodo.entries()) {
      await ctx.agendamentoRepo.salvar(
        agendamentoNoPeriodo(ctx, {
          id: `ag-${status}`,
          dataHoraInicio: segundaAs(8 + indice),
          status,
        }),
      );
    }

    const lista = await sutDe(ctx).executar({
      clinicaId: ctx.clinicaId,
      solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
      dataInicio: segundaAs(8),
      dataFim: segundaAs(14),
    });

    expect(lista.map((a) => a.status).sort()).toEqual(
      [...statusNoPeriodo].sort(),
    );
    expect(lista).toHaveLength(statusNoPeriodo.length);
  });

  it("não retorna agendamento de outra clínica", async () => {
    const ctx = await seedContextoAgendamento("recepcao");
    await ctx.agendamentoRepo.salvar(
      agendamentoNoPeriodo(ctx, {
        id: "da-clinica",
        dataHoraInicio: segundaAs(9),
      }),
    );
    await ctx.agendamentoRepo.salvar(
      agendamentoNoPeriodo(ctx, {
        id: "outra-clinica",
        dataHoraInicio: segundaAs(10),
        clinicaId: "clinica-outra",
      }),
    );

    const lista = await sutDe(ctx).executar({
      clinicaId: ctx.clinicaId,
      solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
      dataInicio: segundaAs(8),
      dataFim: segundaAs(12),
    });

    expect(lista.every((a) => a.clinicaId === ctx.clinicaId)).toBe(true);
    expect(lista.map((a) => a.id)).toEqual(["da-clinica"]);
  });
});
