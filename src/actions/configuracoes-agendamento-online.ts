"use server";

import { z } from "zod";

import { createAgendamentoModule } from "@/core/agendamento/infra/create-agendamento-module";
import {
  AtualizarSlugClinica,
  AtualizarSlugProfissional,
  ObterContextoSessao,
} from "@/core/auth/application/use-cases";
import { createAuthModule } from "@/core/auth/infra/create-auth-module";
import { actionClient } from "@/lib/safe-action";

async function exigirSessaoAdmin() {
  const auth = createAuthModule();
  const ctx = await new ObterContextoSessao(auth.authPort).executar();
  if (!ctx) {
    throw new Error("Sessão expirada. Faça login novamente.");
  }
  return { auth, ctx };
}

export const carregarConfigAgendamentoOnlineAction = actionClient.action(
  async () => {
    const { auth, ctx } = await exigirSessaoAdmin();
    const agendamento = createAgendamentoModule();

    const [clinica, profissionais, menu, procedimentos] = await Promise.all([
      auth.clinicaRepo.buscarPorId(ctx.clinicaId),
      auth.profissionalRepo.listarPorClinica(ctx.clinicaId),
      agendamento.menuRepo.buscarPorClinicaId(ctx.clinicaId),
      agendamento.procedimentoRepo.listarPorClinica(ctx.clinicaId),
    ]);

    if (!clinica) {
      throw new Error("Clínica não encontrada.");
    }

    return {
      papel: ctx.papel,
      clinica: {
        id: clinica.id,
        nome: clinica.nome,
        slug: clinica.slug,
      },
      profissionais: profissionais.map((p) => ({
        id: p.id,
        nome: p.nome,
        slug: p.slug,
        papel: p.papel,
      })),
      menu: menu.estaConfigurado
        ? menu.itens.map((i) => ({
            rotuloPublico: i.rotuloPublico,
            procedimentoId: i.procedimentoId,
          }))
        : [],
      procedimentos: procedimentos.map((p) => ({
        id: p.id,
        nome: p.nome,
      })),
    };
  },
);

export const atualizarSlugClinicaAction = actionClient
  .inputSchema(z.object({ slug: z.string().min(1).max(80) }))
  .action(async ({ parsedInput }) => {
    const { auth, ctx } = await exigirSessaoAdmin();
    const uc = new AtualizarSlugClinica(
      auth.clinicaRepo,
      auth.profissionalRepo,
    );
    const clinica = await uc.executar({
      clinicaId: ctx.clinicaId,
      solicitadoPorUsuarioId: ctx.usuarioId,
      slug: parsedInput.slug,
    });
    return { slug: clinica.slug };
  });

export const atualizarSlugProfissionalAction = actionClient
  .inputSchema(
    z.object({
      profissionalId: z.string().min(1),
      slug: z.string().min(1).max(80),
    }),
  )
  .action(async ({ parsedInput }) => {
    const { auth, ctx } = await exigirSessaoAdmin();
    const uc = new AtualizarSlugProfissional(auth.profissionalRepo);
    const profissional = await uc.executar({
      clinicaId: ctx.clinicaId,
      solicitadoPorUsuarioId: ctx.usuarioId,
      profissionalId: parsedInput.profissionalId,
      slug: parsedInput.slug,
    });
    return { id: profissional.id, slug: profissional.slug };
  });

export const configurarMenuPublicoAction = actionClient
  .inputSchema(
    z.object({
      itens: z
        .array(
          z.object({
            rotuloPublico: z.string().min(1).max(80),
            procedimentoId: z.string().min(1),
          }),
        )
        .min(2)
        .max(4),
    }),
  )
  .action(async ({ parsedInput }) => {
    const { ctx } = await exigirSessaoAdmin();
    const mod = createAgendamentoModule();
    await mod.configurarMenuPublicoDeProcedimentos.executar({
      clinicaId: ctx.clinicaId,
      solicitadoPorUsuarioId: ctx.usuarioId,
      itens: parsedInput.itens,
    });
    return { ok: true as const };
  });
