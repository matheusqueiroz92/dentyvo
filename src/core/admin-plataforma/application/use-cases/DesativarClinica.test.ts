import { describe, expect, it } from "vitest";

import { PermissaoNegadaError } from "@/core/shared/errors";

import { UsuarioPlataformaNaoEncontradoError } from "../../domain/errors";
import {
  CLINICA_ALVO_ID,
  SUPER_ADMIN_ID,
  criarContextoAdminPlataforma,
} from "./helpers-test";
import { DesativarClinica } from "./DesativarClinica";

describe("DesativarClinica", () => {
  it("soft-delete: marca clínica inativa, revoga sessões dos membros e não apaga prontuário", async () => {
    const ctx = await criarContextoAdminPlataforma();
    const sut = new DesativarClinica(
      ctx.clinicaRepo,
      ctx.profissionalRepo,
      ctx.usuarioPlataformaRepo,
      ctx.auth,
      ctx.auditoria,
    );

    const prontuarioAntes = await ctx.prontuarioRepo.buscarPorId(
      CLINICA_ALVO_ID,
      ctx.prontuario.id,
    );
    expect(prontuarioAntes).not.toBeNull();

    await sut.executar({
      solicitadoPorUsuarioPlataformaId: SUPER_ADMIN_ID,
      clinicaId: CLINICA_ALVO_ID,
      motivo: "Encerramento comercial",
    });

    const clinica = await ctx.clinicaRepo.buscarPorId(CLINICA_ALVO_ID);
    expect(clinica?.status).toBe("inativa");

    // Bloqueia login imediato: sessões de todos os membros revogadas.
    expect(ctx.auth.sessoesRevogadas).toContain(ctx.membroUser.id);
    expect(ctx.auth.sessoesRevogadas).toContain(ctx.adminClinicaUser.id);

    // Dado clínico preservado (guarda de registro em saúde).
    const prontuarioDepois = await ctx.prontuarioRepo.buscarPorId(
      CLINICA_ALVO_ID,
      ctx.prontuario.id,
    );
    expect(prontuarioDepois).not.toBeNull();
    expect(prontuarioDepois?.id).toBe(ctx.prontuario.id);
    expect(ctx.prontuarioRepo.items.size).toBe(1);

    expect(ctx.auditoria.eventos.length).toBeGreaterThan(0);
    expect(
      ctx.auditoria.eventos.some((e) => e.detalhe?.motivo === "Encerramento comercial"),
    ).toBe(true);
  });

  it("usuário comum de clínica não pode desativar clínica pela plataforma", async () => {
    const ctx = await criarContextoAdminPlataforma();
    const sut = new DesativarClinica(
      ctx.clinicaRepo,
      ctx.profissionalRepo,
      ctx.usuarioPlataformaRepo,
      ctx.auth,
      ctx.auditoria,
    );

    await expect(
      sut.executar({
        solicitadoPorUsuarioPlataformaId: ctx.adminClinicaUser.id,
        clinicaId: CLINICA_ALVO_ID,
        motivo: "tentativa indevida",
      }),
    ).rejects.toSatisfy(
      (e: unknown) =>
        e instanceof PermissaoNegadaError ||
        e instanceof UsuarioPlataformaNaoEncontradoError,
    );

    expect((await ctx.clinicaRepo.buscarPorId(CLINICA_ALVO_ID))?.status).toBe(
      "ativa",
    );
  });
});
