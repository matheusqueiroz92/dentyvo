"use server";

import { randomUUID } from "node:crypto";
import { z } from "zod";

import { createAgendamentoModule } from "@/core/agendamento/infra/create-agendamento-module";
import { destinatarioUsuario } from "@/core/notificacao/domain/DestinatarioNotificacao";
import { createNotificacaoModule } from "@/core/notificacao/infra/create-notificacao-module";
import { createAuthModule } from "@/core/auth/infra/create-auth-module";
import { cpfEhValido } from "@/lib/pacientes/cpf";
import { actionClient } from "@/lib/safe-action";

import {
  assertCaptchaPublico,
  assertRateLimitPublico,
  chaveRateLimitPublico,
} from "./protecao-agendamento-publico";
import { headers } from "next/headers";

function ipDoCliente(h: Headers): string {
  return (
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip")?.trim() ||
    "unknown"
  );
}

async function assertRateLimit(slug: string): Promise<void> {
  const mod = createAgendamentoModule();
  const h = await headers();
  await assertRateLimitPublico(
    mod.rateLimit,
    chaveRateLimitPublico(ipDoCliente(h), slug),
  );
}

/** Notifica admin e recepção da clínica (in-app) sobre solicitação pendente. */
async function notificarEquipeNovoAgendamentoPublico(input: {
  clinicaId: string;
  agendamentoId: string;
  dataHoraInicio: Date;
}): Promise<void> {
  const auth = createAuthModule();
  const notificacao = createNotificacaoModule();
  const membros = await auth.profissionalRepo.listarPorClinica(input.clinicaId);
  const destinatarios = membros.filter(
    (m) => m.papel === "admin" || m.papel === "recepcao",
  );

  const quando = new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(input.dataHoraInicio);

  for (const membro of destinatarios) {
    try {
      await notificacao.enviarNotificacao.executar({
        id: randomUUID(),
        destinatario: destinatarioUsuario(membro.usuarioId),
        tipo: "novo_agendamento_publico_pendente",
        canais: ["in_app"],
        chaveNegocio: input.agendamentoId,
        clinicaId: input.clinicaId,
        conteudo: {
          titulo: "Novo agendamento pelo link",
          mensagem: `Solicitação pendente de confirmação para ${quando}.`,
          linkAcao: "/agenda",
          agendamentoId: input.agendamentoId,
        },
      });
    } catch (erro) {
      console.error(
        "[agendamento-publico] falha ao notificar equipe",
        membro.usuarioId,
        erro,
      );
    }
  }
}

export const resolverContextoPublicoAction = actionClient
  .inputSchema(
    z.object({
      slugClinica: z.string().min(1),
      slugProfissional: z.string().optional(),
    }),
  )
  .action(async ({ parsedInput }) => {
    await assertRateLimit(parsedInput.slugClinica);
    const mod = createAgendamentoModule();
    const contexto =
      await mod.resolverContextoAgendamentoPublico.executar(parsedInput);
    const resumo = await mod.obterResumoAgendamentoPublico.executar({
      contexto,
    });
    return {
      contexto: {
        clinicaId: contexto.clinicaId,
        slug: contexto.slug,
        profissionalSlug: contexto.profissionalSlug ?? null,
        profissionalPreResolvido: contexto.profissionalPreResolvido,
      },
      resumo,
    };
  });

export const listarHorariosPublicosAction = actionClient
  .inputSchema(
    z.object({
      slugClinica: z.string().min(1),
      slugProfissional: z.string().optional(),
      profissionalId: z.string().min(1),
      dataIso: z.string().datetime(),
    }),
  )
  .action(async ({ parsedInput }) => {
    await assertRateLimit(parsedInput.slugClinica);
    const mod = createAgendamentoModule();
    const contexto = await mod.resolverContextoAgendamentoPublico.executar({
      slugClinica: parsedInput.slugClinica,
      slugProfissional: parsedInput.slugProfissional,
    });
    const horarios =
      await mod.listarHorariosDisponiveisNoLinkPublico.executar({
        contexto,
        profissionalId: parsedInput.profissionalId,
        data: new Date(parsedInput.dataIso),
      });
    return {
      horarios: horarios.map((h) => ({
        inicioIso: h.inicio.toISOString(),
        fimIso: h.fim.toISOString(),
      })),
    };
  });

export const marcarConsultaPublicaAction = actionClient
  .inputSchema(
    z.object({
      slugClinica: z.string().min(1),
      slugProfissional: z.string().optional(),
      nome: z.string().min(1),
      telefone: z.string().min(8),
      cpf: z
        .string()
        .min(11)
        .refine((v) => cpfEhValido(v), "CPF inválido."),
      dataNascimentoIso: z.string().datetime(),
      procedimentoId: z.string().min(1),
      profissionalId: z.string().min(1),
      dataHoraInicioIso: z.string().datetime(),
      aceiteComunicacaoLembretes: z.literal(true),
      captchaToken: z.string().min(1),
    }),
  )
  .action(async ({ parsedInput }) => {
    await assertRateLimit(parsedInput.slugClinica);
    const mod = createAgendamentoModule();
    const h = await headers();
    await assertCaptchaPublico(
      mod.captcha,
      parsedInput.captchaToken,
      ipDoCliente(h),
    );

    const contexto = await mod.resolverContextoAgendamentoPublico.executar({
      slugClinica: parsedInput.slugClinica,
      slugProfissional: parsedInput.slugProfissional,
    });

    const agendamento = await mod.marcarConsultaViaLinkPublico.executar({
      contexto,
      nome: parsedInput.nome,
      telefone: parsedInput.telefone,
      cpf: parsedInput.cpf,
      dataNascimento: new Date(parsedInput.dataNascimentoIso),
      procedimentoId: parsedInput.procedimentoId,
      profissionalId: parsedInput.profissionalId,
      dataHoraInicio: new Date(parsedInput.dataHoraInicioIso),
      aceiteComunicacaoLembretes: parsedInput.aceiteComunicacaoLembretes,
    });

    await notificarEquipeNovoAgendamentoPublico({
      clinicaId: contexto.clinicaId,
      agendamentoId: agendamento.id,
      dataHoraInicio: agendamento.dataHoraInicio,
    });

    return {
      id: agendamento.id,
      status: agendamento.status,
      origem: agendamento.origem,
      dataHoraInicioIso: agendamento.dataHoraInicio.toISOString(),
    };
  });
