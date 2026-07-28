import { describe, expect, it } from "vitest";

import {
  CLINICA_ALVO_ID,
  SUPER_ADMIN_ID,
  criarContextoAdminPlataforma,
} from "./helpers-test";
import { ListarClinicas } from "./ListarClinicas";

describe("ListarClinicas", () => {
  it("super-admin lista clínicas cross-tenant e registra auditoria", async () => {
    const ctx = await criarContextoAdminPlataforma();
    const sut = new ListarClinicas(
      ctx.clinicaRepo,
      ctx.usuarioPlataformaRepo,
      ctx.auditoria,
    );

    const lista = await sut.executar({
      solicitadoPorUsuarioPlataformaId: SUPER_ADMIN_ID,
    });

    expect(lista.some((c) => c.id === CLINICA_ALVO_ID)).toBe(true);
    expect(ctx.auditoria.eventos.length).toBeGreaterThan(0);
  });
});
