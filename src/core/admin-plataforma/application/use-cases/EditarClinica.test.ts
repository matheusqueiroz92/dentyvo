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

  it("não reverte tema alterado concorrentemente ao editar nome e endereço", async () => {
    const ctx = await criarContextoAdminPlataforma();
    const sut = new EditarClinica(
      ctx.clinicaRepo,
      ctx.usuarioPlataformaRepo,
      ctx.auditoria,
    );
    const buscarOriginal = ctx.clinicaRepo.buscarPorId.bind(ctx.clinicaRepo);

    ctx.clinicaRepo.buscarPorId = async (id: string) => {
      const snapshot = await buscarOriginal(id);
      if (snapshot && id === CLINICA_ALVO_ID) {
        ctx.clinicaRepo.items.set(id, snapshot.atualizarTema("verde"));
      }
      return snapshot;
    };

    await sut.executar({
      solicitadoPorUsuarioPlataformaId: SUPER_ADMIN_ID,
      clinicaId: CLINICA_ALVO_ID,
      nome: "Clínica Renomeada",
      endereco: "Av. Nova, 10",
    });

    const persistida = await buscarOriginal(CLINICA_ALVO_ID);
    expect(persistida?.nome).toBe("Clínica Renomeada");
    expect(persistida?.endereco).toBe("Av. Nova, 10");
    expect(persistida?.tema).toBe("verde");
  });
});

