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

  it("não reverte nome, logo nem tema alterados concorrentemente ao desativar", async () => {
    const ctx = await criarContextoAdminPlataforma();
    const sut = new DesativarClinica(
      ctx.clinicaRepo,
      ctx.profissionalRepo,
      ctx.usuarioPlataformaRepo,
      ctx.auth,
      ctx.auditoria,
    );
    const buscarOriginal = ctx.clinicaRepo.buscarPorId.bind(ctx.clinicaRepo);
    const logoConcorrente =
      "https://blob.vercel-storage.com/clinicas/alvo/logo.png";

    ctx.clinicaRepo.buscarPorId = async (id: string) => {
      const snapshot = await buscarOriginal(id);
      if (snapshot && id === CLINICA_ALVO_ID) {
        ctx.clinicaRepo.items.set(
          id,
          snapshot
            .atualizarDadosCadastrais({ nome: "Nome Concorrente" })
            .atualizarLogo(logoConcorrente)
            .atualizarTema("verde"),
        );
      }
      return snapshot;
    };

    await sut.executar({
      solicitadoPorUsuarioPlataformaId: SUPER_ADMIN_ID,
      clinicaId: CLINICA_ALVO_ID,
      motivo: "Encerramento comercial",
    });

    const persistida = await buscarOriginal(CLINICA_ALVO_ID);
    expect(persistida?.status).toBe("inativa");
    expect(persistida?.nome).toBe("Nome Concorrente");
    expect(persistida?.logoUrl).toBe(logoConcorrente);
    expect(persistida?.tema).toBe("verde");
  });
});
