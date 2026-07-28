import type { ProfissionalRepositoryPort } from "@/core/auth/application/ports/ProfissionalRepositoryPort";

import { ProntuarioNaoEncontradoError } from "../../domain/errors";
import type { Prontuario } from "../../domain/Prontuario";
import type { AuditoriaLogPort } from "../ports/AuditoriaLogPort";
import type { ProntuarioRepositoryPort } from "../ports/ProntuarioRepositoryPort";
import {
  autorizarComAuditoria,
  registrarAuditoriaLeitura,
} from "./helpers";

export type ConsultarProntuarioInput = {
  clinicaId: string;
  solicitadoPorUsuarioId: string;
  prontuarioId: string;
};

/**
 * Consulta prontuário por id e sempre registra auditoria de leitura (spec 003).
 * Tentativa negada (RBAC/tenant) também gera `acesso_negado`.
 */
export class ConsultarProntuario {
  constructor(
    private readonly prontuarioRepo: ProntuarioRepositoryPort,
    private readonly profissionalRepo: ProfissionalRepositoryPort,
    private readonly auditoria: AuditoriaLogPort,
  ) {}

  async executar(input: ConsultarProntuarioInput): Promise<Prontuario> {
    const solicitante = await autorizarComAuditoria({
      profissionalRepo: this.profissionalRepo,
      auditoria: this.auditoria,
      clinicaId: input.clinicaId,
      solicitadoPorUsuarioId: input.solicitadoPorUsuarioId,
      acao: "consultar_prontuario",
      recursoTipo: "prontuario",
      recursoId: input.prontuarioId,
    });

    const prontuario = await this.prontuarioRepo.buscarPorId(
      input.clinicaId,
      input.prontuarioId,
    );
    if (!prontuario) {
      throw new ProntuarioNaoEncontradoError(input.prontuarioId);
    }

    await registrarAuditoriaLeitura({
      auditoria: this.auditoria,
      clinicaId: input.clinicaId,
      solicitante,
      recursoTipo: "prontuario",
      recursoId: prontuario.id,
      pacienteId: prontuario.pacienteId,
    });

    return prontuario;
  }
}
