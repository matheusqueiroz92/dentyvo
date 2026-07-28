import { describe, expect, it } from "vitest";

import { PermissaoNegadaError, TenantMismatchError } from "@/core/shared/errors";

import { AnamneseJaPreenchidaError } from "../../domain/errors";
import {
  respostasAnamneseValidas,
} from "../test-doubles/fakes";
import { PreencherAnamnese } from "./PreencherAnamnese";
import { seedContextoAnamnese } from "./helpers-test";

describe("PreencherAnamnese", () => {
  it.each(["admin", "dentista"] as const)(
    "%s preenche primeira versão da anamnese",
    async (papel) => {
      const ctx = await seedContextoAnamnese(papel);
      const sut = new PreencherAnamnese(
        ctx.anamneseRepo,
        ctx.prontuarioRepo,
        ctx.profissionalRepo,
        ctx.auditoria,
      );

      const anamnese = await sut.executar({
        clinicaId: ctx.clinicaId,
        solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
        prontuarioId: ctx.prontuario.id,
        respostas: { ...respostasAnamneseValidas },
      });

      expect(anamnese.versao).toBe(1);
      expect(
        await ctx.anamneseRepo.buscarVersaoVigente(
          ctx.clinicaId,
          ctx.prontuario.id,
        ),
      ).not.toBeNull();
      expect(ctx.auditoria.eventos.some((e) => e.acao === "escrita")).toBe(
        true,
      );
      const detalhe = ctx.auditoria.eventos.find((e) => e.acao === "escrita")
        ?.detalhe;
      expect(JSON.stringify(detalhe ?? {})).not.toContain("Losartana");
    },
  );

  it("não permite segundo preenchimento inicial — use atualizar", async () => {
    const ctx = await seedContextoAnamnese("dentista");
    const sut = new PreencherAnamnese(
      ctx.anamneseRepo,
      ctx.prontuarioRepo,
      ctx.profissionalRepo,
      ctx.auditoria,
    );

    await sut.executar({
      clinicaId: ctx.clinicaId,
      solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
      prontuarioId: ctx.prontuario.id,
      respostas: { ...respostasAnamneseValidas },
    });

    await expect(
      sut.executar({
        clinicaId: ctx.clinicaId,
        solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
        prontuarioId: ctx.prontuario.id,
        respostas: { ...respostasAnamneseValidas },
      }),
    ).rejects.toBeInstanceOf(AnamneseJaPreenchidaError);
  });

  it("recepção não preenche anamnese", async () => {
    const ctx = await seedContextoAnamnese("recepcao");
    const sut = new PreencherAnamnese(
      ctx.anamneseRepo,
      ctx.prontuarioRepo,
      ctx.profissionalRepo,
      ctx.auditoria,
    );

    await expect(
      sut.executar({
        clinicaId: ctx.clinicaId,
        solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
        prontuarioId: ctx.prontuario.id,
        respostas: { ...respostasAnamneseValidas },
      }),
    ).rejects.toBeInstanceOf(PermissaoNegadaError);
  });

  it("isola por tenant", async () => {
    const ctx = await seedContextoAnamnese("admin");
    const sut = new PreencherAnamnese(
      ctx.anamneseRepo,
      ctx.prontuarioRepo,
      ctx.profissionalRepo,
      ctx.auditoria,
    );

    await expect(
      sut.executar({
        clinicaId: "outra-clinica",
        solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
        prontuarioId: ctx.prontuario.id,
        respostas: { ...respostasAnamneseValidas },
      }),
    ).rejects.toBeInstanceOf(TenantMismatchError);
  });
});
