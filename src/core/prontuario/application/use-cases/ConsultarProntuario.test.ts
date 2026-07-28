import { describe, expect, it } from "vitest";

import { PermissaoNegadaError, TenantMismatchError } from "@/core/shared/errors";

import { ConsultarProntuario } from "./ConsultarProntuario";
import { seedProntuarioExistente } from "./helpers-test";

describe("ConsultarProntuario", () => {
  it.each(["admin", "dentista"] as const)(
    "%s consulta prontuário e sempre registra auditoria de leitura",
    async (papel) => {
      const ctx = await seedProntuarioExistente(papel);
      const sut = new ConsultarProntuario(
        ctx.prontuarioRepo,
        ctx.profissionalRepo,
        ctx.auditoria,
      );

      const prontuario = await sut.executar({
        clinicaId: ctx.clinicaId,
        solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
        prontuarioId: ctx.prontuario.id,
      });

      expect(prontuario.id).toBe(ctx.prontuario.id);
      expect(ctx.auditoria.eventos).toHaveLength(1);
      expect(ctx.auditoria.eventos[0]?.acao).toBe("leitura");
      expect(ctx.auditoria.eventos[0]?.recursoTipo).toBe("prontuario");
      expect(ctx.auditoria.eventos[0]?.recursoId).toBe(ctx.prontuario.id);
      expect(JSON.stringify(ctx.auditoria.eventos[0]?.detalhe ?? {})).not.toMatch(
        /abscesso|alergia|descrição/i,
      );
    },
  );

  it("recepção não consulta prontuário clínico e gera acesso_negado", async () => {
    const ctx = await seedProntuarioExistente("recepcao");
    const sut = new ConsultarProntuario(
      ctx.prontuarioRepo,
      ctx.profissionalRepo,
      ctx.auditoria,
    );

    await expect(
      sut.executar({
        clinicaId: ctx.clinicaId,
        solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
        prontuarioId: ctx.prontuario.id,
      }),
    ).rejects.toBeInstanceOf(PermissaoNegadaError);

    expect(
      ctx.auditoria.eventos.some((e) => e.acao === "acesso_negado"),
    ).toBe(true);
  });

  it("bloqueia consulta cross-tenant e registra acesso_negado", async () => {
    const ctx = await seedProntuarioExistente("dentista");
    const sut = new ConsultarProntuario(
      ctx.prontuarioRepo,
      ctx.profissionalRepo,
      ctx.auditoria,
    );

    await expect(
      sut.executar({
        clinicaId: "outra-clinica",
        solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
        prontuarioId: ctx.prontuario.id,
      }),
    ).rejects.toBeInstanceOf(TenantMismatchError);

    expect(
      ctx.auditoria.eventos.some((e) => e.acao === "acesso_negado"),
    ).toBe(true);
  });
});
