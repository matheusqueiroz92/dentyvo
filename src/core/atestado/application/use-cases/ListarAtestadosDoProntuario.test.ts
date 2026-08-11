import { describe, expect, it } from "vitest";

import { ProntuarioNaoEncontradoError } from "@/core/prontuario/domain/errors";
import { PermissaoNegadaError, TenantMismatchError } from "@/core/shared/errors";

import { Atestado } from "../../domain/Atestado";
import { cabecalhoValido } from "../test-doubles/fakes";
import { seedContextoAtestado } from "./helpers-test";
import { ListarAtestadosDoProntuario } from "./ListarAtestadosDoProntuario";

describe("ListarAtestadosDoProntuario", () => {
  it("dentista lista histórico do prontuário (mais recente primeiro)", async () => {
    const ctx = await seedContextoAtestado("dentista");
    const antiga = Atestado.emitir({
      id: "atest-antiga",
      clinicaId: ctx.clinicaId,
      prontuarioId: ctx.prontuario.id,
      profissionalId: ctx.profissional.id,
      motivo: "comparecimento",
      dataInicio: new Date("2026-07-01T00:00:00.000Z"),
      quantidadeDias: 1,
      cabecalho: cabecalhoValido,
      emitidaEm: new Date("2026-07-01T10:00:00.000Z"),
    });
    const recente = Atestado.emitir({
      id: "atest-recente",
      clinicaId: ctx.clinicaId,
      prontuarioId: ctx.prontuario.id,
      profissionalId: ctx.profissional.id,
      motivo: "repouso pós-procedimento",
      dataInicio: new Date("2026-07-20T00:00:00.000Z"),
      quantidadeDias: 3,
      cabecalho: cabecalhoValido,
      emitidaEm: new Date("2026-07-20T10:00:00.000Z"),
    });
    await ctx.atestadoRepo.salvar(antiga);
    await ctx.atestadoRepo.salvar(recente);

    const sut = new ListarAtestadosDoProntuario(
      ctx.atestadoRepo,
      ctx.prontuarioRepo,
      ctx.profissionalRepo,
    );

    const lista = await sut.executar({
      clinicaId: ctx.clinicaId,
      solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
      prontuarioId: ctx.prontuario.id,
    });

    expect(lista.map((a) => a.id)).toEqual(["atest-recente", "atest-antiga"]);
  });

  it("admin da clínica não lista atestados", async () => {
    const ctx = await seedContextoAtestado("admin");
    const sut = new ListarAtestadosDoProntuario(
      ctx.atestadoRepo,
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

  it.each(["admin", "recepcao"] as const)(
    "%s não lista atestados",
    async (papel) => {
      const ctx = await seedContextoAtestado(papel);
      const sut = new ListarAtestadosDoProntuario(
        ctx.atestadoRepo,
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
    const ctx = await seedContextoAtestado("dentista");
    const sut = new ListarAtestadosDoProntuario(
      ctx.atestadoRepo,
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
    const ctx = await seedContextoAtestado("dentista");
    const sut = new ListarAtestadosDoProntuario(
      ctx.atestadoRepo,
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
