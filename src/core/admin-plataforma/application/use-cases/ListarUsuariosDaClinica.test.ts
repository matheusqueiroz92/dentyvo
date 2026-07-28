import { describe, expect, it } from "vitest";

import {
  CLINICA_ALVO_ID,
  SUPER_ADMIN_ID,
  criarContextoAdminPlataforma,
} from "./helpers-test";
import { ListarUsuariosDaClinica } from "./ListarUsuariosDaClinica";

describe("ListarUsuariosDaClinica", () => {
  it("super-admin lista profissionais de qualquer clínica", async () => {
    const ctx = await criarContextoAdminPlataforma();
    const sut = new ListarUsuariosDaClinica(
      ctx.profissionalRepo,
      ctx.usuarioPlataformaRepo,
      ctx.auditoria,
    );

    const membros = await sut.executar({
      solicitadoPorUsuarioPlataformaId: SUPER_ADMIN_ID,
      clinicaId: CLINICA_ALVO_ID,
    });

    expect(membros.length).toBeGreaterThanOrEqual(2);
    expect(membros.some((m) => m.id === ctx.membro.id)).toBe(true);
    expect(ctx.auditoria.eventos.length).toBeGreaterThan(0);
  });
});
