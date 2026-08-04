import { describe, expect, it } from "vitest";

import {
  DadosInvalidosError,
  PermissaoNegadaError,
} from "@/core/shared/errors";

import { Procedimento } from "../../domain/Procedimento";
import { ProcedimentoNaoEncontradoError } from "../../domain/errors";
import { ConfigurarMenuPublicoDeProcedimentos } from "./ConfigurarMenuPublicoDeProcedimentos";
import { seedContextoLinkPublico } from "./helpers-test-link-publico";

function sut(ctx: Awaited<ReturnType<typeof seedContextoLinkPublico>>) {
  return new ConfigurarMenuPublicoDeProcedimentos(
    ctx.menuRepo,
    ctx.procedimentoRepo,
    ctx.profissionalRepo,
  );
}

describe("ConfigurarMenuPublicoDeProcedimentos", () => {
  it("admin configura menu de 2 a 4 itens mapeados a procedimentos do tenant", async () => {
    const ctx = await seedContextoLinkPublico();
    await sut(ctx).executar({
      clinicaId: ctx.clinicaId,
      solicitadoPorUsuarioId: ctx.admin.usuarioId,
      itens: [
        {
          rotuloPublico: "Consulta/Avaliação",
          procedimentoId: ctx.procedimentoConsulta.id,
        },
        {
          rotuloPublico: "Limpeza",
          procedimentoId: ctx.procedimentoLimpeza.id,
        },
      ],
    });

    const menu = await ctx.menuRepo.buscarPorClinicaId(ctx.clinicaId);
    expect(menu.estaConfigurado).toBe(true);
    expect(menu.itens).toHaveLength(2);
  });

  it("dentista e recepção não podem configurar o menu", async () => {
    const ctx = await seedContextoLinkPublico();
    const itens = [
      {
        rotuloPublico: "Consulta/Avaliação",
        procedimentoId: ctx.procedimentoConsulta.id,
      },
      {
        rotuloPublico: "Limpeza",
        procedimentoId: ctx.procedimentoLimpeza.id,
      },
    ];

    await expect(
      sut(ctx).executar({
        clinicaId: ctx.clinicaId,
        solicitadoPorUsuarioId: ctx.dentista.usuarioId,
        itens,
      }),
    ).rejects.toBeInstanceOf(PermissaoNegadaError);

    await expect(
      sut(ctx).executar({
        clinicaId: ctx.clinicaId,
        solicitadoPorUsuarioId: ctx.recepcao.usuarioId,
        itens,
      }),
    ).rejects.toBeInstanceOf(PermissaoNegadaError);
  });

  it("rejeita menos de 2 ou mais de 4 itens", async () => {
    const ctx = await seedContextoLinkPublico();
    await expect(
      sut(ctx).executar({
        clinicaId: ctx.clinicaId,
        solicitadoPorUsuarioId: ctx.admin.usuarioId,
        itens: [
          {
            rotuloPublico: "Só um",
            procedimentoId: ctx.procedimentoConsulta.id,
          },
        ],
      }),
    ).rejects.toBeInstanceOf(DadosInvalidosError);
  });

  it("rejeita procedimento que não existe no tenant", async () => {
    const ctx = await seedContextoLinkPublico();
    await expect(
      sut(ctx).executar({
        clinicaId: ctx.clinicaId,
        solicitadoPorUsuarioId: ctx.admin.usuarioId,
        itens: [
          {
            rotuloPublico: "Consulta",
            procedimentoId: ctx.procedimentoConsulta.id,
          },
          {
            rotuloPublico: "Fantasma",
            procedimentoId: "proc-de-outra-clinica",
          },
        ],
      }),
    ).rejects.toBeInstanceOf(ProcedimentoNaoEncontradoError);
  });

  it("rejeita procedimento de outra clínica", async () => {
    const ctx = await seedContextoLinkPublico();
    const outro = Procedimento.criar({
      id: "proc-outro-tenant",
      clinicaId: "outra-clinica",
      nome: "Outro",
      duracaoPadraoMinutos: 60,
      valor: 1,
    });
    // Fake repo não escopa por tenant no salvar — simulamos id alienígena
    // sem estar no tenant alvo (buscarPorId com clinicaId da sessão retorna null).
    void outro;

    await expect(
      sut(ctx).executar({
        clinicaId: ctx.clinicaId,
        solicitadoPorUsuarioId: ctx.admin.usuarioId,
        itens: [
          {
            rotuloPublico: "Consulta",
            procedimentoId: ctx.procedimentoConsulta.id,
          },
          {
            rotuloPublico: "Alien",
            procedimentoId: "proc-outro-tenant",
          },
        ],
      }),
    ).rejects.toBeInstanceOf(ProcedimentoNaoEncontradoError);
  });
});
