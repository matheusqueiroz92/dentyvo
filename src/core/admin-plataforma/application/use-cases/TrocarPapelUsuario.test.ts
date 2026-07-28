import { describe, expect, it } from "vitest";

import { CroObrigatorioError } from "@/core/auth/domain/errors";
import { PermissaoNegadaError } from "@/core/shared/errors";

import { UsuarioPlataformaNaoEncontradoError } from "../../domain/errors";
import {
  CLINICA_ALVO_ID,
  SUPER_ADMIN_ID,
  criarContextoAdminPlataforma,
} from "./helpers-test";
import { TrocarPapelUsuario } from "./TrocarPapelUsuario";

describe("TrocarPapelUsuario", () => {
  it("super-admin troca papel de profissional em qualquer clínica", async () => {
    const ctx = await criarContextoAdminPlataforma();
    const sut = new TrocarPapelUsuario(
      ctx.profissionalRepo,
      ctx.usuarioPlataformaRepo,
      ctx.auditoria,
    );

    const atualizado = await sut.executar({
      solicitadoPorUsuarioPlataformaId: SUPER_ADMIN_ID,
      clinicaId: CLINICA_ALVO_ID,
      profissionalId: ctx.membro.id,
      novoPapel: "admin",
    });

    expect(atualizado.papel).toBe("admin");
    expect(
      (
        await ctx.profissionalRepo.buscarPorId(CLINICA_ALVO_ID, ctx.membro.id)
      )?.papel,
    ).toBe("admin");
    expect(ctx.auditoria.eventos.length).toBeGreaterThan(0);
  });

  it("preserva CRO obrigatório para dentista mesmo quando executado pelo super-admin", async () => {
    const ctx = await criarContextoAdminPlataforma();
    const sut = new TrocarPapelUsuario(
      ctx.profissionalRepo,
      ctx.usuarioPlataformaRepo,
      ctx.auditoria,
    );

    await expect(
      sut.executar({
        solicitadoPorUsuarioPlataformaId: SUPER_ADMIN_ID,
        clinicaId: CLINICA_ALVO_ID,
        profissionalId: ctx.membro.id,
        novoPapel: "dentista",
      }),
    ).rejects.toBeInstanceOf(CroObrigatorioError);

    const comCro = await sut.executar({
      solicitadoPorUsuarioPlataformaId: SUPER_ADMIN_ID,
      clinicaId: CLINICA_ALVO_ID,
      profissionalId: ctx.membro.id,
      novoPapel: "dentista",
      cro: "CRO-12345",
    });
    expect(comCro.papel).toBe("dentista");
    expect(comCro.cro).toBe("CRO-12345");
  });

  it("não revoga sessões ao trocar papel", async () => {
    const ctx = await criarContextoAdminPlataforma();
    const sut = new TrocarPapelUsuario(
      ctx.profissionalRepo,
      ctx.usuarioPlataformaRepo,
      ctx.auditoria,
    );

    await sut.executar({
      solicitadoPorUsuarioPlataformaId: SUPER_ADMIN_ID,
      clinicaId: CLINICA_ALVO_ID,
      profissionalId: ctx.membro.id,
      novoPapel: "admin",
    });

    expect(ctx.auth.sessoesRevogadas).toHaveLength(0);
  });

  it("usuário comum de clínica não pode trocar papel pela plataforma", async () => {
    const ctx = await criarContextoAdminPlataforma();
    const sut = new TrocarPapelUsuario(
      ctx.profissionalRepo,
      ctx.usuarioPlataformaRepo,
      ctx.auditoria,
    );

    await expect(
      sut.executar({
        solicitadoPorUsuarioPlataformaId: ctx.adminClinicaUser.id,
        clinicaId: CLINICA_ALVO_ID,
        profissionalId: ctx.membro.id,
        novoPapel: "admin",
      }),
    ).rejects.toSatisfy(
      (e: unknown) =>
        e instanceof PermissaoNegadaError ||
        e instanceof UsuarioPlataformaNaoEncontradoError,
    );
  });
});
