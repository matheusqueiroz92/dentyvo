import { describe, expect, it } from "vitest";

import { PermissaoNegadaError } from "@/core/shared/errors";

import { Anamnese } from "../../domain/Anamnese";
import { respostasAnamneseValidas } from "../test-doubles/fakes";
import { ListarVersoesAnamnese } from "./ListarVersoesAnamnese";
import { seedContextoAnamnese } from "./helpers-test";

describe("ListarVersoesAnamnese", () => {
  it("lista snapshots sem gerar auditoria de listagem", async () => {
    const ctx = await seedContextoAnamnese("dentista");
    await ctx.anamneseRepo.salvar(
      Anamnese.criarInicial({
        id: "ana-1",
        clinicaId: ctx.clinicaId,
        prontuarioId: ctx.prontuario.id,
        respostas: { ...respostasAnamneseValidas },
        preenchidoPorProfissionalId: ctx.profissional.id,
      }),
    );

    const sut = new ListarVersoesAnamnese(
      ctx.anamneseRepo,
      ctx.prontuarioRepo,
      ctx.profissionalRepo,
    );

    const versoes = await sut.executar({
      clinicaId: ctx.clinicaId,
      solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
      prontuarioId: ctx.prontuario.id,
    });

    expect(versoes).toHaveLength(1);
    expect(ctx.auditoria.eventos).toHaveLength(0);
  });

  it("recepção não lista versões", async () => {
    const ctx = await seedContextoAnamnese("recepcao");
    const sut = new ListarVersoesAnamnese(
      ctx.anamneseRepo,
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
});
