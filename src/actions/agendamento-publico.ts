"use server";

import { headers } from "next/headers";
import { z } from "zod";

import { createAgendamentoModule } from "@/core/agendamento/infra/create-agendamento-module";
import { actionClient } from "@/lib/safe-action";

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
  const chave = `${ipDoCliente(h)}:${slug}`;
  const ok = await mod.rateLimit.permitir(chave);
  if (!ok) {
    throw Object.assign(new Error("Muitas tentativas. Tente novamente em instantes."), {
      nome: "RateLimitExcedidoError",
    });
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
    return { contexto, resumo };
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
      cpf: z.string().min(11),
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
    const captchaOk = await mod.captcha.verificar(
      parsedInput.captchaToken,
      ipDoCliente(h),
    );
    if (!captchaOk) {
      throw Object.assign(new Error("Validação CAPTCHA falhou. Tente novamente."), {
        nome: "CaptchaInvalidoError",
      });
    }

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

    return {
      id: agendamento.id,
      status: agendamento.status,
      origem: agendamento.origem,
      dataHoraInicioIso: agendamento.dataHoraInicio.toISOString(),
    };
  });
