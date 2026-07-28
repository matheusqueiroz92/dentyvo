import { describe, expect, it } from "vitest";

import {
  CLINICA_ALVO_ID,
  SUPER_ADMIN_ID,
  criarContextoAdminPlataforma,
} from "./helpers-test";
import { RemoverUsuario } from "./RemoverUsuario";

describe("RemoverUsuario", () => {
  it("super-admin remove vínculo profissional sem apagar prontuário da clínica", async () => {
    const ctx = await criarContextoAdminPlataforma();
    const sut = new RemoverUsuario(
      ctx.profissionalRepo,
      ctx.usuarioPlataformaRepo,
      ctx.auth,
      ctx.auditoria,
    );

    await sut.executar({
      solicitadoPorUsuarioPlataformaId: SUPER_ADMIN_ID,
      usuarioId: ctx.membroUser.id,
    });

    expect(
      await ctx.profissionalRepo.buscarPorUsuarioId(ctx.membroUser.id),
    ).toBeNull();
    expect(
      await ctx.prontuarioRepo.buscarPorId(CLINICA_ALVO_ID, ctx.prontuario.id),
    ).not.toBeNull();
    expect(ctx.auditoria.eventos.length).toBeGreaterThan(0);
  });
});
