import { describe, expect, it } from "vitest";

import { PermissaoNegadaError } from "@/core/shared/errors";

import {
  UsuarioDaClinicaNaoEncontradoError,
  UsuarioPlataformaNaoEncontradoError,
} from "../../domain/errors";
import {
  CLINICA_ALVO_ID,
  SUPER_ADMIN_ID,
  criarContextoAdminPlataforma,
} from "./helpers-test";
import { RevogarSessoesDoUsuario } from "./RevogarSessoesDoUsuario";

describe("RevogarSessoesDoUsuario", () => {
  it("super-admin revoga sessões de usuário de qualquer clínica (cross-tenant)", async () => {
    const ctx = await criarContextoAdminPlataforma();
    const sut = new RevogarSessoesDoUsuario(
      ctx.profissionalRepo,
      ctx.usuarioPlataformaRepo,
      ctx.auth,
      ctx.auditoria,
    );

    // Super-admin NÃO pertence à clínica do alvo — só identidade de plataforma.
    expect(ctx.superAdmin).not.toHaveProperty("clinicaId");

    await sut.executar({
      solicitadoPorUsuarioPlataformaId: SUPER_ADMIN_ID,
      usuarioId: ctx.membroUser.id,
    });

    expect(ctx.auth.sessoesRevogadas).toContain(ctx.membroUser.id);
    // Senha permanece — “revogar sessões” ≠ reset de senha.
    expect(ctx.auth.usuarios.get(ctx.membroUser.id)?.senha).toBe("senha-atual");
    expect(ctx.auditoria.eventos.length).toBeGreaterThan(0);
  });

  it("não exige que o super-admin seja membro da clínica do usuário-alvo", async () => {
    const ctx = await criarContextoAdminPlataforma();
    const sut = new RevogarSessoesDoUsuario(
      ctx.profissionalRepo,
      ctx.usuarioPlataformaRepo,
      ctx.auth,
      ctx.auditoria,
    );

    const membrosPlataformaNaClinica = (
      await ctx.profissionalRepo.listarPorClinica(CLINICA_ALVO_ID)
    ).filter((p) => p.usuarioId === SUPER_ADMIN_ID);
    expect(membrosPlataformaNaClinica).toHaveLength(0);

    await expect(
      sut.executar({
        solicitadoPorUsuarioPlataformaId: SUPER_ADMIN_ID,
        usuarioId: ctx.membroUser.id,
      }),
    ).resolves.toBeUndefined();
  });

  it("falha se o usuário-alvo não estiver vinculado a nenhuma clínica", async () => {
    const ctx = await criarContextoAdminPlataforma();
    const sut = new RevogarSessoesDoUsuario(
      ctx.profissionalRepo,
      ctx.usuarioPlataformaRepo,
      ctx.auth,
      ctx.auditoria,
    );
    const orfao = await ctx.auth.criarUsuario({
      nome: "Órfão",
      email: "orfao@x.com",
      senha: "s",
    });

    await expect(
      sut.executar({
        solicitadoPorUsuarioPlataformaId: SUPER_ADMIN_ID,
        usuarioId: orfao.id,
      }),
    ).rejects.toBeInstanceOf(UsuarioDaClinicaNaoEncontradoError);
  });

  it("usuário comum de clínica não pode revogar sessões pela plataforma", async () => {
    const ctx = await criarContextoAdminPlataforma();
    const sut = new RevogarSessoesDoUsuario(
      ctx.profissionalRepo,
      ctx.usuarioPlataformaRepo,
      ctx.auth,
      ctx.auditoria,
    );

    await expect(
      sut.executar({
        solicitadoPorUsuarioPlataformaId: ctx.adminClinicaUser.id,
        usuarioId: ctx.membroUser.id,
      }),
    ).rejects.toSatisfy(
      (e: unknown) =>
        e instanceof PermissaoNegadaError ||
        e instanceof UsuarioPlataformaNaoEncontradoError,
    );
    expect(ctx.auth.sessoesRevogadas).not.toContain(ctx.membroUser.id);
  });
});
