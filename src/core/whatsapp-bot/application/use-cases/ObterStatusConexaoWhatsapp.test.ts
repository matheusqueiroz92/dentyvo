import { describe, expect, it } from "vitest";

import { PermissaoNegadaError } from "@/core/shared/errors";

import { ClinicWhatsappAccount } from "../../domain/ClinicWhatsappAccount";
import { seedSolicitanteWhatsapp } from "./helpers-test";
import { ObterStatusConexaoWhatsapp } from "./ObterStatusConexaoWhatsapp";

const EXPIRA_EM = new Date("2030-01-01T00:00:00.000Z");

describe("ObterStatusConexaoWhatsapp", () => {
  it("retorna status desconectado quando a clínica nunca conectou", async () => {
    const ctx = await seedSolicitanteWhatsapp("admin");
    const sut = new ObterStatusConexaoWhatsapp(
      ctx.contaRepo,
      ctx.profissionalRepo,
    );

    const status = await sut.executar({
      clinicaId: ctx.clinicaId,
      solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
    });

    expect(status).toEqual({
      status: "desconectado",
      phoneNumberId: null,
      conectadoEm: null,
      tokenExpiraEm: null,
    });
  });

  it("retorna os dados da conta conectada sem expor o token", async () => {
    const ctx = await seedSolicitanteWhatsapp("admin");
    const conectada = ClinicWhatsappAccount.criarPendente({
      id: "conta-1",
      clinicaId: ctx.clinicaId,
    }).concluirConexao({
      wabaId: "waba-1",
      phoneNumberId: "phone-1",
      accessTokenCriptografado: "enc:token-secreto",
      tokenExpiraEm: EXPIRA_EM,
      conectadoEm: new Date("2026-01-10T12:00:00.000Z"),
    });
    await ctx.contaRepo.salvar(conectada);

    const sut = new ObterStatusConexaoWhatsapp(
      ctx.contaRepo,
      ctx.profissionalRepo,
    );
    const status = await sut.executar({
      clinicaId: ctx.clinicaId,
      solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
    });

    expect(status).toEqual({
      status: "conectado",
      phoneNumberId: "phone-1",
      conectadoEm: new Date("2026-01-10T12:00:00.000Z"),
      tokenExpiraEm: EXPIRA_EM,
    });
    expect(JSON.stringify(status)).not.toContain("token-secreto");
  });

  it("reflete status pendente enquanto o popup não foi concluído", async () => {
    const ctx = await seedSolicitanteWhatsapp("admin");
    await ctx.contaRepo.salvar(
      ClinicWhatsappAccount.criarPendente({
        id: "conta-1",
        clinicaId: ctx.clinicaId,
      }),
    );

    const sut = new ObterStatusConexaoWhatsapp(
      ctx.contaRepo,
      ctx.profissionalRepo,
    );

    await expect(
      sut.executar({
        clinicaId: ctx.clinicaId,
        solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
      }),
    ).resolves.toMatchObject({ status: "pendente", phoneNumberId: null });
  });

  it.each(["dentista", "recepcao"] as const)(
    "nega leitura de status para %s",
    async (papel) => {
      const ctx = await seedSolicitanteWhatsapp(papel);
      const sut = new ObterStatusConexaoWhatsapp(
        ctx.contaRepo,
        ctx.profissionalRepo,
      );

      await expect(
        sut.executar({
          clinicaId: ctx.clinicaId,
          solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
        }),
      ).rejects.toBeInstanceOf(PermissaoNegadaError);
    },
  );

  it("não devolve conta de outra clínica", async () => {
    const ctx = await seedSolicitanteWhatsapp("admin");
    await ctx.contaRepo.salvar(
      ClinicWhatsappAccount.criarPendente({
        id: "conta-outra",
        clinicaId: "clinica-outra",
      }),
    );

    const sut = new ObterStatusConexaoWhatsapp(
      ctx.contaRepo,
      ctx.profissionalRepo,
    );

    await expect(
      sut.executar({
        clinicaId: ctx.clinicaId,
        solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
      }),
    ).resolves.toMatchObject({ status: "desconectado" });
  });
});
