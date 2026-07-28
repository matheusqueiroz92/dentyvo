import { describe, expect, it } from "vitest";

import { PermissaoNegadaError } from "@/core/shared/errors";

import { Anamnese } from "../../domain/Anamnese";
import { AnamneseNaoEncontradaError } from "../../domain/errors";
import { respostasAnamneseValidas } from "../test-doubles/fakes";
import { AtualizarAnamnese } from "./AtualizarAnamnese";
import { seedContextoAnamnese } from "./helpers-test";

describe("AtualizarAnamnese", () => {
  it("cria nova versão snapshot sem apagar a anterior", async () => {
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

    const sut = new AtualizarAnamnese(
      ctx.anamneseRepo,
      ctx.prontuarioRepo,
      ctx.profissionalRepo,
      ctx.auditoria,
    );

    const nova = await sut.executar({
      clinicaId: ctx.clinicaId,
      solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
      prontuarioId: ctx.prontuario.id,
      respostas: {
        ...respostasAnamneseValidas,
        alergias: { texto: "Látex", negado: false },
      },
    });

    expect(nova.versao).toBe(2);
    const versoes = await ctx.anamneseRepo.listarPorProntuario(
      ctx.clinicaId,
      ctx.prontuario.id,
    );
    expect(versoes).toHaveLength(2);
    expect(versoes[0]?.versao).toBe(1);
    expect(versoes[1]?.versao).toBe(2);
  });

  it("falha ao atualizar quando ainda não há anamnese", async () => {
    const ctx = await seedContextoAnamnese("admin");
    const sut = new AtualizarAnamnese(
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
    ).rejects.toBeInstanceOf(AnamneseNaoEncontradaError);
  });

  it("recepção não atualiza anamnese", async () => {
    const ctx = await seedContextoAnamnese("recepcao");
    const sut = new AtualizarAnamnese(
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
});
