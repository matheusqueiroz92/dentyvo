import { describe, expect, it } from "vitest";

import { ProntuarioNaoEncontradoError } from "@/core/prontuario/domain/errors";
import { PermissaoNegadaError, TenantMismatchError } from "@/core/shared/errors";

import { Periograma } from "../../domain/Periograma";
import { denteMolarParcial, seedContextoPeriograma } from "./helpers-test";
import { ListarPeriogramasDoProntuario } from "./ListarPeriogramasDoProntuario";

describe("ListarPeriogramasDoProntuario", () => {
  it("dentista lista histórico ordenado por registradoEm descendente", async () => {
    const ctx = await seedContextoPeriograma("dentista");
    const antigo = Periograma.registrar({
      id: "perio-antigo",
      clinicaId: ctx.clinicaId,
      prontuarioId: ctx.prontuario.id,
      profissionalId: ctx.profissional.id,
      tipo: "exame_inicial",
      registradoEm: new Date("2026-07-01T10:00:00.000Z"),
      dentes: [denteMolarParcial({ mobilidade: 1 })],
    });
    const recente = Periograma.registrar({
      id: "perio-recente",
      clinicaId: ctx.clinicaId,
      prontuarioId: ctx.prontuario.id,
      profissionalId: ctx.profissional.id,
      tipo: "reavaliacao",
      registradoEm: new Date("2026-07-20T10:00:00.000Z"),
      dentes: [denteMolarParcial({ mobilidade: 2 })],
    });
    await ctx.periogramaRepo.salvar(antigo);
    await ctx.periogramaRepo.salvar(recente);

    const sut = new ListarPeriogramasDoProntuario(
      ctx.periogramaRepo,
      ctx.prontuarioRepo,
      ctx.profissionalRepo,
    );

    const lista = await sut.executar({
      clinicaId: ctx.clinicaId,
      solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
      prontuarioId: ctx.prontuario.id,
    });

    expect(lista.map((p) => p.id)).toEqual(["perio-recente", "perio-antigo"]);
  });

  it.each(["admin", "dentista"] as const)(
    "%s pode listar periogramas do prontuário",
    async (papel) => {
      const ctx = await seedContextoPeriograma(papel);
      const sut = new ListarPeriogramasDoProntuario(
        ctx.periogramaRepo,
        ctx.prontuarioRepo,
        ctx.profissionalRepo,
      );

      const lista = await sut.executar({
        clinicaId: ctx.clinicaId,
        solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
        prontuarioId: ctx.prontuario.id,
      });

      expect(lista).toEqual([]);
    },
  );

  it("recepção não lista periogramas", async () => {
    const ctx = await seedContextoPeriograma("recepcao");
    const sut = new ListarPeriogramasDoProntuario(
      ctx.periogramaRepo,
      ctx.prontuarioRepo,
      ctx.profissionalRepo,
    );

    await expect(
      sut.executar({
        clinicaId: ctx.clinicaId,
        solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
        prontuarioId: ctx.prontuario.id,
      }),
    ).rejects.toBeInstanceOf(PermissaoNegadaError);
  });

  it("falha quando prontuário não existe na clínica", async () => {
    const ctx = await seedContextoPeriograma("dentista");
    const sut = new ListarPeriogramasDoProntuario(
      ctx.periogramaRepo,
      ctx.prontuarioRepo,
      ctx.profissionalRepo,
    );

    await expect(
      sut.executar({
        clinicaId: ctx.clinicaId,
        solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
        prontuarioId: "pront-inexistente",
      }),
    ).rejects.toBeInstanceOf(ProntuarioNaoEncontradoError);
  });

  it("isola por tenant", async () => {
    const ctx = await seedContextoPeriograma("dentista");
    const sut = new ListarPeriogramasDoProntuario(
      ctx.periogramaRepo,
      ctx.prontuarioRepo,
      ctx.profissionalRepo,
    );

    await expect(
      sut.executar({
        clinicaId: "outra-clinica",
        solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
        prontuarioId: ctx.prontuario.id,
      }),
    ).rejects.toBeInstanceOf(TenantMismatchError);
  });
});
