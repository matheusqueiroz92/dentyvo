import { randomUUID } from "node:crypto";

import type { ProfissionalRepositoryPort } from "@/core/auth/application/ports/ProfissionalRepositoryPort";

import { Paciente } from "../../domain/Paciente";
import type { PacienteRepositoryPort } from "../ports/PacienteRepositoryPort";
import { autorizar, obterSolicitanteNaClinica } from "./helpers";

export type CriarPacienteInput = {
  clinicaId: string;
  solicitadoPorUsuarioId: string;
  nome: string;
  cpf: string;
  telefone: string;
  dataNascimento: Date;
  contatoEmergencia?: string | null;
};

/**
 * Cadastra paciente na clínica da sessão (spec 002 — CRUD mínimo).
 */
export class CriarPaciente {
  constructor(
    private readonly pacienteRepo: PacienteRepositoryPort,
    private readonly profissionalRepo: ProfissionalRepositoryPort,
  ) {}

  async executar(input: CriarPacienteInput): Promise<Paciente> {
    const solicitante = await obterSolicitanteNaClinica(
      this.profissionalRepo,
      input.solicitadoPorUsuarioId,
      input.clinicaId,
    );
    autorizar(solicitante, "criar_paciente");

    const paciente = Paciente.criar({
      id: randomUUID(),
      clinicaId: input.clinicaId,
      nome: input.nome,
      cpf: input.cpf,
      telefone: input.telefone,
      dataNascimento: input.dataNascimento,
      contatoEmergencia: input.contatoEmergencia,
    });

    await this.pacienteRepo.salvar(paciente);
    return paciente;
  }
}
