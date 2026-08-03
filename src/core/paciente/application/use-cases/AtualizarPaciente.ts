import type { ProfissionalRepositoryPort } from "@/core/auth/application/ports/ProfissionalRepositoryPort";

import { PacienteNaoEncontradoError } from "../../domain/errors";
import type { Paciente } from "../../domain/Paciente";
import type { PacienteRepositoryPort } from "../ports/PacienteRepositoryPort";
import { autorizar, obterSolicitanteNaClinica } from "./helpers";

/**
 * Dados cadastrais editáveis do paciente (spec 002 — decisão 13).
 * Estruturalmente sem `cpf`: o TypeScript impede alterar CPF por esta via.
 */
export type AtualizarPacienteDados = {
  nome: string;
  telefone: string;
  dataNascimento: Date;
  contatoEmergencia?: string | null;
};

export type AtualizarPacienteInput = {
  clinicaId: string;
  solicitadoPorUsuarioId: string;
  pacienteId: string;
  dados: AtualizarPacienteDados;
};

/**
 * Atualiza dados cadastrais do paciente na clínica da sessão.
 * CPF permanece imutável após a criação (spec 002 — decisão 13).
 */
export class AtualizarPaciente {
  constructor(
    private readonly pacienteRepo: PacienteRepositoryPort,
    private readonly profissionalRepo: ProfissionalRepositoryPort,
  ) {}

  async executar(input: AtualizarPacienteInput): Promise<Paciente> {
    const solicitante = await obterSolicitanteNaClinica(
      this.profissionalRepo,
      input.solicitadoPorUsuarioId,
      input.clinicaId,
    );
    autorizar(solicitante, "atualizar_paciente");

    const existente = await this.pacienteRepo.buscarPorId(
      input.clinicaId,
      input.pacienteId,
    );
    if (!existente) {
      throw new PacienteNaoEncontradoError(input.pacienteId);
    }

    const atualizado = existente.atualizarDados(input.dados);
    await this.pacienteRepo.salvar(atualizado);
    return atualizado;
  }
}
