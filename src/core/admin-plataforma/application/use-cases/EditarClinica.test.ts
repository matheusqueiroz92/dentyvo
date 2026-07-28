import { describe, expect, it } from "vitest";

import {
  CLINICA_ALVO_ID,
  SUPER_ADMIN_ID,
  criarContextoAdminPlataforma,
} from "./helpers-test";
import { EditarClinica } from "./EditarClinica";

describe("EditarClinica", () => {
  it("super-admin edita dados cadastrais de qualquer clínica", async () => {
    const ctx = await criarContextoAdminPlataforma();
    const sut = new EditarClinica(
      ctx.clinicaRepo,
      ctx.usuarioPlataformaRepo,
      ctx.auditoria,
    );

    const atualizada = await sut.executar({
      solicitadoPorUsuarioPlataformaId: SUPER_ADMIN_ID,
      clinicaId: CLINICA_ALVO_ID,
      nome: "Clínica Renomeada",
      endereco: "Av. Nova, 10",
    });

    expect(atualizada.nome).toBe("Clínica Renomeada");
    expect(atualizada.endereco).toBe("Av. Nova, 10");
    expect(ctx.auditoria.eventos.length).toBeGreaterThan(0);
  });
});
