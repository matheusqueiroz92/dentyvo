"use server";

import { z } from "zod";

import { BuscarPacientePorId } from "@/core/paciente/application/use-cases/BuscarPacientePorId";
import { CriarPaciente } from "@/core/paciente/application/use-cases/CriarPaciente";
import { ListarPacientes } from "@/core/paciente/application/use-cases/ListarPacientes";
import { createPacienteModule } from "@/core/paciente/infra/create-paciente-module";
import { ObterContextoSessao } from "@/core/auth/application/use-cases/ObterContextoSessao";
import { createAuthModule } from "@/core/auth/infra/create-auth-module";
import { apenasDigitos, cpfEhValido } from "@/lib/pacientes/cpf";
import { parseDataNascimentoLocal } from "@/lib/pacientes/formatacao";
import { pacienteParaDto } from "@/lib/pacientes/mapear";
import type { PacienteDTO } from "@/lib/pacientes/types";
import { actionClient } from "@/lib/safe-action";

async function exigirSessao() {
  const auth = createAuthModule();
  const ctx = await new ObterContextoSessao(auth.authPort).executar();
  if (!ctx) {
    throw new Error("Sessão expirada. Faça login novamente.");
  }
  return ctx;
}

export const listarPacientesAction = actionClient.action(
  async (): Promise<PacienteDTO[]> => {
    const sessao = await exigirSessao();
    const mod = createPacienteModule();
    const lista = await new ListarPacientes(
      mod.pacienteRepo,
      mod.profissionalRepo,
    ).executar({
      clinicaId: sessao.clinicaId,
      solicitadoPorUsuarioId: sessao.usuarioId,
    });
    return lista.map(pacienteParaDto);
  },
);

export const buscarPacientePorIdAction = actionClient
  .inputSchema(z.object({ pacienteId: z.string().uuid() }))
  .action(async ({ parsedInput }): Promise<PacienteDTO> => {
    const sessao = await exigirSessao();
    const mod = createPacienteModule();
    const paciente = await new BuscarPacientePorId(
      mod.pacienteRepo,
      mod.profissionalRepo,
    ).executar({
      clinicaId: sessao.clinicaId,
      solicitadoPorUsuarioId: sessao.usuarioId,
      pacienteId: parsedInput.pacienteId,
    });
    return pacienteParaDto(paciente);
  });

export const criarPacienteAction = actionClient
  .inputSchema(
    z.object({
      nome: z.string().trim().min(1).max(200),
      cpf: z
        .string()
        .refine((v) => cpfEhValido(v), "CPF inválido."),
      telefone: z.string().min(1),
      dataNascimento: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/),
      contatoEmergencia: z.string().max(200).optional(),
    }),
  )
  .action(async ({ parsedInput }): Promise<PacienteDTO> => {
    const sessao = await exigirSessao();
    const mod = createPacienteModule();
    const paciente = await new CriarPaciente(
      mod.pacienteRepo,
      mod.profissionalRepo,
    ).executar({
      clinicaId: sessao.clinicaId,
      solicitadoPorUsuarioId: sessao.usuarioId,
      nome: parsedInput.nome,
      cpf: apenasDigitos(parsedInput.cpf),
      telefone: apenasDigitos(parsedInput.telefone),
      dataNascimento: parseDataNascimentoLocal(parsedInput.dataNascimento),
      contatoEmergencia: parsedInput.contatoEmergencia?.trim() || null,
    });
    return pacienteParaDto(paciente);
  });
