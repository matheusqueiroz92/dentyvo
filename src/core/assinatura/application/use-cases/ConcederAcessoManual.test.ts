import { describe, expect, it } from "vitest";

import { UsuarioPlataformaNaoEncontradoError } from "@/core/admin-plataforma/domain/errors";
import { PermissaoNegadaError } from "@/core/shared/errors";

import {
  CLINICA_ID,
  SUPER_ADMIN_ID,
  criarContextoAssinatura,
  seedTrialAtivo,
  usuarioPlataformaNaoSuperAdmin,
} from "./helpers-test";
import { ConcederAcessoManual } from "./ConcederAcessoManual";

function sut(ctx: Awaited<ReturnType<typeof criarContextoAssinatura>>) {
  return new ConcederAcessoManual(
    ctx.assinaturaRepo,
    ctx.usuarioPlataformaRepo,
    ctx.auditoria,
  );
}

describe("ConcederAcessoManual", () => {
  it("super-admin concede override sem alterar status real e registra auditoria", async () => {
    const ctx = await criarContextoAssinatura();
    const trial = await seedTrialAtivo(ctx);
    const inadimplente = trial
      .ativarAposPagamento({
        planoId: "plano-basico",
        gatewayClienteId: "gw-cli-1",
        gatewayAssinaturaId: "gw-sub-1",
        dataProximaCobranca: new Date("2026-08-01T12:00:00.000Z"),
      })
      .marcarInadimplente();
    await ctx.assinaturaRepo.salvar(inadimplente);

    const ateData = new Date("2026-08-30T12:00:00.000Z");
    await sut(ctx).executar({
      solicitadoPorUsuarioPlataformaId: SUPER_ADMIN_ID,
      clinicaId: CLINICA_ID,
      motivo: "período de negociação",
      ateData,
    });

    const assinatura = await ctx.assinaturaRepo.buscarPorClinicaId(CLINICA_ID);
    expect(assinatura?.status).toBe("inadimplente");
    expect(assinatura?.acessoManualAte).toEqual(ateData);
    expect(assinatura?.acessoManualMotivo).toBe("período de negociação");
    expect(
      assinatura?.avaliarAcesso(new Date("2026-08-10T12:00:00.000Z")),
    ).toMatchObject({
      permitido: true,
      motivo: "acesso_manual",
    });

    expect(ctx.auditoria.eventos.length).toBeGreaterThan(0);
    expect(
      ctx.auditoria.eventos.some(
        (e) =>
          e.recursoTipo === "assinatura" &&
          e.atorUsuarioPlataformaId === SUPER_ADMIN_ID &&
          e.detalhe?.motivo === "período de negociação",
      ),
    ).toBe(true);
  });

  it("usuário de clínica (mesmo admin) não pode conceder acesso manual", async () => {
    const ctx = await criarContextoAssinatura("admin");
    await seedTrialAtivo(ctx);

    await expect(
      sut(ctx).executar({
        solicitadoPorUsuarioPlataformaId: ctx.solicitadoPorUsuarioId,
        clinicaId: CLINICA_ID,
        motivo: "tentativa indevida",
        ateData: new Date("2026-08-30T12:00:00.000Z"),
      }),
    ).rejects.toSatisfy(
      (e: unknown) =>
        e instanceof PermissaoNegadaError ||
        e instanceof UsuarioPlataformaNaoEncontradoError,
    );

    const assinatura = await ctx.assinaturaRepo.buscarPorClinicaId(CLINICA_ID);
    expect(assinatura?.acessoManualAte).toBeNull();
    expect(ctx.auditoria.eventos).toHaveLength(0);
  });

  it("UsuarioPlataforma que não é super-admin é negado pelo gate binário", async () => {
    const ctx = await criarContextoAssinatura();
    await seedTrialAtivo(ctx);
    const impostor = usuarioPlataformaNaoSuperAdmin();
    await ctx.usuarioPlataformaRepo.salvar(impostor);

    await expect(
      sut(ctx).executar({
        solicitadoPorUsuarioPlataformaId: impostor.id,
        clinicaId: CLINICA_ID,
        motivo: "sem permissão",
        ateData: new Date("2026-08-30T12:00:00.000Z"),
      }),
    ).rejects.toBeInstanceOf(PermissaoNegadaError);

    expect(ctx.auditoria.eventos).toHaveLength(0);
  });
});
