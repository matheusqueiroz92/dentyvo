import { describe, expect, it } from "vitest";

import { PermissaoNegadaError, TenantMismatchError } from "@/core/shared/errors";

import { ProntuarioJaExisteError } from "../../domain/errors";
import { CriarProntuario } from "./CriarProntuario";
import { seedContextoProntuario } from "./helpers-test";

describe("CriarProntuario", () => {
  it.each(["admin", "dentista"] as const)(
    "%s pode criar prontuário único do paciente na clínica",
    async (papel) => {
      const ctx = await seedContextoProntuario(papel);
      const sut = new CriarProntuario(
        ctx.prontuarioRepo,
        ctx.pacienteRepo,
        ctx.profissionalRepo,
        ctx.auditoria,
      );

      const prontuario = await sut.executar({
        clinicaId: ctx.clinicaId,
        solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
        pacienteId: ctx.pacienteId,
      });

      expect(prontuario.pacienteId).toBe(ctx.pacienteId);
      expect(prontuario.clinicaId).toBe(ctx.clinicaId);
      expect(
        await ctx.prontuarioRepo.buscarPorPacienteId(
          ctx.clinicaId,
          ctx.pacienteId,
        ),
      ).not.toBeNull();
      expect(ctx.auditoria.eventos.some((e) => e.acao === "escrita")).toBe(
        true,
      );
    },
  );

  it("recepção não pode criar prontuário", async () => {
    const ctx = await seedContextoProntuario("recepcao");
    const sut = new CriarProntuario(
      ctx.prontuarioRepo,
      ctx.pacienteRepo,
      ctx.profissionalRepo,
      ctx.auditoria,
    );

    await expect(
      sut.executar({
        clinicaId: ctx.clinicaId,
        solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
        pacienteId: ctx.pacienteId,
      }),
    ).rejects.toBeInstanceOf(PermissaoNegadaError);

    expect(
      ctx.auditoria.eventos.some((e) => e.acao === "acesso_negado"),
    ).toBe(true);
  });

  it("não permite criar prontuário em clínica diferente da do solicitante", async () => {
    const ctx = await seedContextoProntuario("dentista");
    const sut = new CriarProntuario(
      ctx.prontuarioRepo,
      ctx.pacienteRepo,
      ctx.profissionalRepo,
      ctx.auditoria,
    );

    await expect(
      sut.executar({
        clinicaId: "outra-clinica",
        solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
        pacienteId: ctx.pacienteId,
      }),
    ).rejects.toBeInstanceOf(TenantMismatchError);
  });

  it("não cria segundo prontuário para o mesmo paciente na clínica", async () => {
    const ctx = await seedContextoProntuario("admin");
    const sut = new CriarProntuario(
      ctx.prontuarioRepo,
      ctx.pacienteRepo,
      ctx.profissionalRepo,
      ctx.auditoria,
    );

    await sut.executar({
      clinicaId: ctx.clinicaId,
      solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
      pacienteId: ctx.pacienteId,
    });

    await expect(
      sut.executar({
        clinicaId: ctx.clinicaId,
        solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
        pacienteId: ctx.pacienteId,
      }),
    ).rejects.toBeInstanceOf(ProntuarioJaExisteError);
  });
});
