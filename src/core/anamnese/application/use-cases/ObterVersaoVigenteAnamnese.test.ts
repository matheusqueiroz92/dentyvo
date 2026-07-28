import { describe, expect, it } from "vitest";

import { PermissaoNegadaError, TenantMismatchError } from "@/core/shared/errors";

import { Anamnese } from "../../domain/Anamnese";
import { respostasAnamneseValidas } from "../test-doubles/fakes";
import { ObterVersaoVigenteAnamnese } from "./ObterVersaoVigenteAnamnese";
import { seedContextoAnamnese } from "./helpers-test";

describe("ObterVersaoVigenteAnamnese", () => {
  it("retorna null quando ainda não há anamnese", async () => {
    const ctx = await seedContextoAnamnese("dentista");
    const sut = new ObterVersaoVigenteAnamnese(
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
    ).resolves.toBeNull();
  });

  it("retorna a maior versão como vigente", async () => {
    const ctx = await seedContextoAnamnese("admin");
    const v1 = Anamnese.criarInicial({
      id: "ana-1",
      clinicaId: ctx.clinicaId,
      prontuarioId: ctx.prontuario.id,
      respostas: { ...respostasAnamneseValidas },
      preenchidoPorProfissionalId: ctx.profissional.id,
    });
    const v2 = Anamnese.criarProximaVersao({
      id: "ana-2",
      vigente: v1,
      respostas: {
        ...respostasAnamneseValidas,
        alergias: { texto: "Látex", negado: false },
      },
      preenchidoPorProfissionalId: ctx.profissional.id,
    });
    await ctx.anamneseRepo.salvar(v1);
    await ctx.anamneseRepo.salvar(v2);

    const sut = new ObterVersaoVigenteAnamnese(
      ctx.anamneseRepo,
      ctx.prontuarioRepo,
      ctx.profissionalRepo,
    );

    const vigente = await sut.executar({
      clinicaId: ctx.clinicaId,
      solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
      prontuarioId: ctx.prontuario.id,
    });

    expect(vigente?.versao).toBe(2);
    expect(vigente?.id).toBe("ana-2");
  });

  it("recepção não obtém versão vigente", async () => {
    const ctx = await seedContextoAnamnese("recepcao");
    const sut = new ObterVersaoVigenteAnamnese(
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

  it("isola por tenant", async () => {
    const ctx = await seedContextoAnamnese("dentista");
    const sut = new ObterVersaoVigenteAnamnese(
      ctx.anamneseRepo,
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
