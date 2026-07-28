import { describe, expect, it } from "vitest";

import { PermissaoNegadaError } from "@/core/shared/errors";

import { RegistrarEvolucao } from "./RegistrarEvolucao";
import { seedProntuarioExistente } from "./helpers-test";

describe("RegistrarEvolucao", () => {
  it.each(["admin", "dentista"] as const)(
    "%s registra evolução append-only vinculada ao profissional da sessão",
    async (papel) => {
      const ctx = await seedProntuarioExistente(papel);
      const sut = new RegistrarEvolucao(
        ctx.evolucaoRepo,
        ctx.prontuarioRepo,
        ctx.profissionalRepo,
        ctx.auditoria,
      );

      const evolucao = await sut.executar({
        clinicaId: ctx.clinicaId,
        solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
        prontuarioId: ctx.prontuario.id,
        descricao: "Profilaxia realizada sem intercorrências.",
        procedimentoId: "proc-opaco",
      });

      expect(evolucao.tipo).toBe("registro");
      expect(evolucao.profissionalId).toBe(ctx.profissional.id);
      expect(evolucao.procedimentoId).toBe("proc-opaco");
      expect(
        await ctx.evolucaoRepo.buscarPorId(ctx.clinicaId, evolucao.id),
      ).not.toBeNull();
      expect(ctx.auditoria.eventos.some((e) => e.acao === "escrita")).toBe(
        true,
      );
      const detalhe = ctx.auditoria.eventos.find((e) => e.acao === "escrita")
        ?.detalhe;
      expect(JSON.stringify(detalhe ?? {})).not.toContain("Profilaxia");
    },
  );

  it("recepção não registra evolução", async () => {
    const ctx = await seedProntuarioExistente("recepcao");
    const sut = new RegistrarEvolucao(
      ctx.evolucaoRepo,
      ctx.prontuarioRepo,
      ctx.profissionalRepo,
      ctx.auditoria,
    );

    await expect(
      sut.executar({
        clinicaId: ctx.clinicaId,
        solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
        prontuarioId: ctx.prontuario.id,
        descricao: "Tentativa indevida",
      }),
    ).rejects.toBeInstanceOf(PermissaoNegadaError);
  });
});
