import { describe, expect, it } from "vitest";

import { CPF_VALIDO } from "@/core/auth/application/test-doubles/fakes";
import { PermissaoNegadaError } from "@/core/shared/errors";

import { UsuarioPlataformaNaoEncontradoError } from "../../domain/errors";
import { CriarClinicaManualmente } from "./CriarClinicaManualmente";
import { DesativarClinica } from "./DesativarClinica";
import { EditarClinica } from "./EditarClinica";
import {
  CLINICA_ALVO_ID,
  criarContextoAdminPlataforma,
} from "./helpers-test";
import { ListarClinicas } from "./ListarClinicas";
import { ListarUsuariosDaClinica } from "./ListarUsuariosDaClinica";
import { RemoverUsuario } from "./RemoverUsuario";
import { RevogarSessoesDoUsuario } from "./RevogarSessoesDoUsuario";
import { TrocarPapelUsuario } from "./TrocarPapelUsuario";

/**
 * Spec 009: usuário de clínica (mesmo admin do tenant) não executa ações
 * do módulo admin-plataforma — só `UsuarioPlataforma` / super-admin.
 */
describe("negação a usuário comum em todas as ações do módulo", () => {
  it("admin de clínica (não super-admin) é negado em todas as ações MVP", async () => {
    const ctx = await criarContextoAdminPlataforma();
    const atorComum = ctx.adminClinicaUser.id;

    const assertNegado = async (acao: () => Promise<unknown>) => {
      await expect(acao()).rejects.toSatisfy(
        (e: unknown) =>
          e instanceof PermissaoNegadaError ||
          e instanceof UsuarioPlataformaNaoEncontradoError,
      );
    };

    await assertNegado(() =>
      new ListarClinicas(
        ctx.clinicaRepo,
        ctx.usuarioPlataformaRepo,
        ctx.auditoria,
      ).executar({ solicitadoPorUsuarioPlataformaId: atorComum }),
    );

    await assertNegado(() =>
      new CriarClinicaManualmente(
        ctx.clinicaRepo,
        ctx.profissionalRepo,
        ctx.usuarioPlataformaRepo,
        ctx.auth,
        ctx.auditoria,
      ).executar({
        solicitadoPorUsuarioPlataformaId: atorComum,
        clinica: {
          nome: "X",
          endereco: "Y",
          tipoDocumento: "cpf",
          documento: CPF_VALIDO,
        },
        admin: { nome: "A", email: "a@b.com", senha: "s" },
      }),
    );

    await assertNegado(() =>
      new EditarClinica(
        ctx.clinicaRepo,
        ctx.usuarioPlataformaRepo,
        ctx.auditoria,
      ).executar({
        solicitadoPorUsuarioPlataformaId: atorComum,
        clinicaId: CLINICA_ALVO_ID,
        nome: "Hack",
        endereco: "Hack",
      }),
    );

    await assertNegado(() =>
      new DesativarClinica(
        ctx.clinicaRepo,
        ctx.profissionalRepo,
        ctx.usuarioPlataformaRepo,
        ctx.auth,
        ctx.auditoria,
      ).executar({
        solicitadoPorUsuarioPlataformaId: atorComum,
        clinicaId: CLINICA_ALVO_ID,
        motivo: "tentativa",
      }),
    );

    await assertNegado(() =>
      new ListarUsuariosDaClinica(
        ctx.profissionalRepo,
        ctx.usuarioPlataformaRepo,
        ctx.auditoria,
      ).executar({
        solicitadoPorUsuarioPlataformaId: atorComum,
        clinicaId: CLINICA_ALVO_ID,
      }),
    );

    await assertNegado(() =>
      new RemoverUsuario(
        ctx.profissionalRepo,
        ctx.usuarioPlataformaRepo,
        ctx.auth,
        ctx.auditoria,
      ).executar({
        solicitadoPorUsuarioPlataformaId: atorComum,
        usuarioId: ctx.membroUser.id,
      }),
    );

    await assertNegado(() =>
      new RevogarSessoesDoUsuario(
        ctx.profissionalRepo,
        ctx.usuarioPlataformaRepo,
        ctx.auth,
        ctx.auditoria,
      ).executar({
        solicitadoPorUsuarioPlataformaId: atorComum,
        usuarioId: ctx.membroUser.id,
      }),
    );

    await assertNegado(() =>
      new TrocarPapelUsuario(
        ctx.profissionalRepo,
        ctx.usuarioPlataformaRepo,
        ctx.auditoria,
      ).executar({
        solicitadoPorUsuarioPlataformaId: atorComum,
        clinicaId: CLINICA_ALVO_ID,
        profissionalId: ctx.membro.id,
        novoPapel: "admin",
      }),
    );
  });
});
