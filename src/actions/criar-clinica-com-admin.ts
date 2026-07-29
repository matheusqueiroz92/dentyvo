"use server";

import { z } from "zod";

import { cadastrarClinicaComTrial } from "@/actions/cadastrar-clinica-com-trial";
import { IniciarTrial } from "@/core/assinatura/application/use-cases/IniciarTrial";
import { DrizzleAssinaturaRepository } from "@/core/assinatura/infra/adapters";
import { CriarClinicaComAdmin } from "@/core/auth/application/use-cases/CriarClinicaComAdmin";
import { createAuthModule } from "@/core/auth/infra/create-auth-module";
import { db } from "@/db";
import { actionClient } from "@/lib/safe-action";

const schema = z.object({
  clinica: z.object({
    nome: z.string().min(1),
    endereco: z.string().min(1),
    tipoDocumento: z.enum(["cpf", "cnpj"]),
    documento: z.string().min(1),
  }),
  admin: z.object({
    nome: z.string().min(1),
    email: z.string().email(),
    senha: z.string().min(8),
  }),
});

/**
 * Server action pública de cadastro (spec 001 + orquestração 010).
 *
 * - Entrada validada por Zod (`.inputSchema`) antes da orquestração —
 *   conforme architecture.mdc (delivery valida; use case recebe input limpo).
 * - Erros de domínio (ex.: `DocumentoClinicaDuplicadoError`,
 *   `DocumentoFiscalInvalidoError`) chegam ao cliente via
 *   `result.serverError = { codigo, mensagem }` — sem stack trace
 *   (ver `handleServerError` em `@/lib/safe-action`).
 *
 * Delega a `cadastrarClinicaComTrial` (CriarClinicaComAdmin → IniciarTrial).
 */
export const criarClinicaComAdminAction = actionClient
  .inputSchema(schema)
  .action(async ({ parsedInput }) => {
    const auth = createAuthModule();
    const criarClinicaComAdmin = new CriarClinicaComAdmin(
      auth.clinicaRepo,
      auth.profissionalRepo,
      auth.authPort,
    );
    const iniciarTrial = new IniciarTrial(new DrizzleAssinaturaRepository(db));

    const clinica = await cadastrarClinicaComTrial(
      { criarClinicaComAdmin, iniciarTrial },
      parsedInput,
    );

    return {
      clinicaId: clinica.id,
      nome: clinica.nome,
      status: clinica.status,
    };
  });
