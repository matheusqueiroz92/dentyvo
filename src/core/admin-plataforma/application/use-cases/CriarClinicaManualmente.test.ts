import { describe, expect, it } from "vitest";

import {
  SUPER_ADMIN_ID,
  criarContextoAdminPlataforma,
} from "./helpers-test";
import { CriarClinicaManualmente } from "./CriarClinicaManualmente";

describe("CriarClinicaManualmente", () => {
  it("super-admin cria clínica com admin (onboarding assistido) e registra auditoria", async () => {
    const ctx = await criarContextoAdminPlataforma();
    const sut = new CriarClinicaManualmente(
      ctx.clinicaRepo,
      ctx.profissionalRepo,
      ctx.usuarioPlataformaRepo,
      ctx.auth,
      ctx.auditoria,
    );

    const clinica = await sut.executar({
      solicitadoPorUsuarioPlataformaId: SUPER_ADMIN_ID,
      clinica: {
        nome: "Nova Assistida",
        endereco: "Rua B, 2",
        tipoDocumento: "cnpj",
        documento: "11222333000181",
      },
      admin: {
        nome: "Admin Novo",
        email: "admin.novo@clinica.com",
        senha: "senha-forte",
      },
    });

    expect(clinica.status).toBe("ativa");
    expect(await ctx.clinicaRepo.buscarPorId(clinica.id)).not.toBeNull();
    const membros = await ctx.profissionalRepo.listarPorClinica(clinica.id);
    expect(membros).toHaveLength(1);
    expect(membros[0]?.papel).toBe("admin");
    expect(ctx.auditoria.eventos.length).toBeGreaterThan(0);
  });
});
