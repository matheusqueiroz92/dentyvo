import { describe, expect, it } from "vitest";

import { ProntuarioNaoEncontradoError } from "@/core/prontuario/domain/errors";
import { PermissaoNegadaError, TenantMismatchError } from "@/core/shared/errors";

import { Receita } from "../../domain/Receita";
import {
  cabecalhoValido,
  itemReceitaValido,
} from "../test-doubles/fakes";
import { ListarReceitasDoProntuario } from "./ListarReceitasDoProntuario";
import { seedContextoReceituario } from "./helpers-test";

describe("ListarReceitasDoProntuario", () => {
  it("dentista lista histórico do prontuário (mais recente primeiro)", async () => {
    const ctx = await seedContextoReceituario("dentista");
    const antiga = Receita.emitir({
      id: "rec-antiga",
      clinicaId: ctx.clinicaId,
      prontuarioId: ctx.prontuario.id,
      profissionalId: ctx.profissional.id,
      itens: [itemReceitaValido],
      cabecalho: cabecalhoValido,
      emitidaEm: new Date("2026-07-01T10:00:00.000Z"),
    });
    const recente = Receita.emitir({
      id: "rec-recente",
      clinicaId: ctx.clinicaId,
      prontuarioId: ctx.prontuario.id,
      profissionalId: ctx.profissional.id,
      itens: [{ ...itemReceitaValido, dosagem: "250 mg" }],
      cabecalho: cabecalhoValido,
      emitidaEm: new Date("2026-07-20T10:00:00.000Z"),
    });
    await ctx.receitaRepo.salvar(antiga);
    await ctx.receitaRepo.salvar(recente);

    const sut = new ListarReceitasDoProntuario(
      ctx.receitaRepo,
      ctx.prontuarioRepo,
      ctx.profissionalRepo,
    );

    const lista = await sut.executar({
      clinicaId: ctx.clinicaId,
      solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
      prontuarioId: ctx.prontuario.id,
    });

    expect(lista.map((r) => r.id)).toEqual(["rec-recente", "rec-antiga"]);
  });

  it.each(["admin", "recepcao"] as const)(
    "%s não lista receitas",
    async (papel) => {
      const ctx = await seedContextoReceituario(papel);
      const sut = new ListarReceitasDoProntuario(
        ctx.receitaRepo,
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
    },
  );

  it("falha quando prontuário não existe na clínica", async () => {
    const ctx = await seedContextoReceituario("dentista");
    const sut = new ListarReceitasDoProntuario(
      ctx.receitaRepo,
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
    const ctx = await seedContextoReceituario("dentista");
    const sut = new ListarReceitasDoProntuario(
      ctx.receitaRepo,
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
