import { randomUUID } from "node:crypto";

import type { ProfissionalRepositoryPort } from "@/core/auth/application/ports/ProfissionalRepositoryPort";
import type { PacienteRepositoryPort } from "@/core/paciente/application/ports/PacienteRepositoryPort";
import { PacienteNaoEncontradoError } from "@/core/paciente/domain/errors";

import { ProntuarioJaExisteError } from "../../domain/errors";
import { Prontuario } from "../../domain/Prontuario";
import type { AuditoriaLogPort } from "../ports/AuditoriaLogPort";
import type { ProntuarioRepositoryPort } from "../ports/ProntuarioRepositoryPort";
import {
  autorizarComAuditoria,
  registrarAuditoriaEscrita,
} from "./helpers";

export type CriarProntuarioInput = {
  clinicaId: string;
  solicitadoPorUsuarioId: string;
  pacienteId: string;
};

/**
 * Cria prontuário único do paciente na clínica (spec 003).
 * Consome `PacienteRepositoryPort` (feature 002).
 */
export class CriarProntuario {
  constructor(
    private readonly prontuarioRepo: ProntuarioRepositoryPort,
    private readonly pacienteRepo: PacienteRepositoryPort,
    private readonly profissionalRepo: ProfissionalRepositoryPort,
    private readonly auditoria: AuditoriaLogPort,
  ) {}

  async executar(input: CriarProntuarioInput): Promise<Prontuario> {
    const solicitante = await autorizarComAuditoria({
      profissionalRepo: this.profissionalRepo,
      auditoria: this.auditoria,
      clinicaId: input.clinicaId,
      solicitadoPorUsuarioId: input.solicitadoPorUsuarioId,
      acao: "criar_prontuario",
      recursoTipo: "prontuario",
      recursoId: input.pacienteId,
      pacienteId: input.pacienteId,
    });

    const paciente = await this.pacienteRepo.buscarPorId(
      input.clinicaId,
      input.pacienteId,
    );
    if (!paciente) {
      throw new PacienteNaoEncontradoError(input.pacienteId);
    }

    const existente = await this.prontuarioRepo.buscarPorPacienteId(
      input.clinicaId,
      input.pacienteId,
    );
    if (existente) {
      throw new ProntuarioJaExisteError(input.pacienteId);
    }

    const prontuario = Prontuario.criar({
      id: randomUUID(),
      clinicaId: input.clinicaId,
      pacienteId: input.pacienteId,
    });

    await this.prontuarioRepo.salvar(prontuario);
    await registrarAuditoriaEscrita({
      auditoria: this.auditoria,
      clinicaId: input.clinicaId,
      solicitante,
      recursoTipo: "prontuario",
      recursoId: prontuario.id,
      pacienteId: paciente.id,
    });

    return prontuario;
  }
}
