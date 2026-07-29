import { describe, expect, it } from "vitest";

import { PermissaoNegadaError, TenantMismatchError } from "@/core/shared/errors";

import { PeriogramaNaoEncontradoError } from "../../domain/errors";
import { Periograma } from "../../domain/Periograma";
import { denteMolarParcial, seedContextoPeriograma } from "./helpers-test";
import { ConsultarPeriograma } from "./ConsultarPeriograma";

describe("ConsultarPeriograma", () => {
  it("dentista consulta periograma do tenant", async () => {
    const ctx = await seedContextoPeriograma("dentista");
    const salvo = Periograma.registrar({
      id: "perio-1",
      clinicaId: ctx.clinicaId,
      prontuarioId: ctx.prontuario.id,
      profissionalId: ctx.profissional.id,
      tipo: "exame_inicial",
      dentes: [denteMolarParcial()],
    });
    await ctx.periogramaRepo.salvar(salvo);

    const sut = new ConsultarPeriograma(
      ctx.periogramaRepo,
      ctx.profissionalRepo,
    );

    const periograma = await sut.executar({
      clinicaId: ctx.clinicaId,
      solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
      periogramaId: salvo.id,
    });

    expect(periograma.id).toBe(salvo.id);
    expect(periograma.tipo).toBe("exame_inicial");
  });

  it.each(["admin", "dentista"] as const)(
    "%s pode consultar periograma",
    async (papel) => {
      const ctx = await seedContextoPeriograma(papel);
      const salvo = Periograma.registrar({
        id: `perio-${papel}`,
        clinicaId: ctx.clinicaId,
        prontuarioId: ctx.prontuario.id,
        profissionalId: ctx.profissional.id,
        tipo: "exame_inicial",
        dentes: [denteMolarParcial()],
      });
      await ctx.periogramaRepo.salvar(salvo);

      const sut = new ConsultarPeriograma(
        ctx.periogramaRepo,
        ctx.profissionalRepo,
      );

      const periograma = await sut.executar({
        clinicaId: ctx.clinicaId,
        solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
        periogramaId: salvo.id,
      });

      expect(periograma.id).toBe(salvo.id);
    },
  );

  it("recepção não consulta periograma", async () => {
    const ctx = await seedContextoPeriograma("recepcao");
    const sut = new ConsultarPeriograma(
      ctx.periogramaRepo,
      ctx.profissionalRepo,
    );

    await expect(
      sut.executar({
        clinicaId: ctx.clinicaId,
        solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
        periogramaId: "perio-qualquer",
      }),
    ).rejects.toBeInstanceOf(PermissaoNegadaError);
  });

  it("falha quando periograma não existe na clínica", async () => {
    const ctx = await seedContextoPeriograma("dentista");
    const sut = new ConsultarPeriograma(
      ctx.periogramaRepo,
      ctx.profissionalRepo,
    );

    await expect(
      sut.executar({
        clinicaId: ctx.clinicaId,
        solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
        periogramaId: "perio-inexistente",
      }),
    ).rejects.toBeInstanceOf(PeriogramaNaoEncontradoError);
  });

  it("isola por tenant", async () => {
    const ctx = await seedContextoPeriograma("dentista");
    const sut = new ConsultarPeriograma(
      ctx.periogramaRepo,
      ctx.profissionalRepo,
    );

    await expect(
      sut.executar({
        clinicaId: "outra-clinica",
        solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
        periogramaId: "perio-1",
      }),
    ).rejects.toBeInstanceOf(TenantMismatchError);
  });
});
