import { randomUUID } from "node:crypto";

import type { ProfissionalRepositoryPort } from "@/core/auth/application/ports/ProfissionalRepositoryPort";

import { Evolucao } from "../../domain/Evolucao";
import { ProntuarioNaoEncontradoError } from "../../domain/errors";
import type { AuditoriaLogPort } from "../ports/AuditoriaLogPort";
import type { EvolucaoRepositoryPort } from "../ports/EvolucaoRepositoryPort";
import type { ProntuarioRepositoryPort } from "../ports/ProntuarioRepositoryPort";
import {
  autorizarComAuditoria,
  registrarAuditoriaEscrita,
} from "./helpers";

export type RegistrarEvolucaoInput = {
  clinicaId: string;
  solicitadoPorUsuarioId: string;
  prontuarioId: string;
  descricao: string;
  /** Id opaco — não validado contra agendamento no MVP. */
  procedimentoId?: string | null;
};

/**
 * Registra evolução clínica append-only (spec 003).
 * `profissionalId` vem do solicitante autenticado (sessão 001).
 */
export class RegistrarEvolucao {
  constructor(
    private readonly evolucaoRepo: EvolucaoRepositoryPort,
    private readonly prontuarioRepo: ProntuarioRepositoryPort,
    private readonly profissionalRepo: ProfissionalRepositoryPort,
    private readonly auditoria: AuditoriaLogPort,
  ) {}

  async executar(input: RegistrarEvolucaoInput): Promise<Evolucao> {
    const solicitante = await autorizarComAuditoria({
      profissionalRepo: this.profissionalRepo,
      auditoria: this.auditoria,
      clinicaId: input.clinicaId,
      solicitadoPorUsuarioId: input.solicitadoPorUsuarioId,
      acao: "registrar_evolucao",
      recursoTipo: "evolucao",
      recursoId: input.prontuarioId,
    });

    const prontuario = await this.prontuarioRepo.buscarPorId(
      input.clinicaId,
      input.prontuarioId,
    );
    if (!prontuario) {
      throw new ProntuarioNaoEncontradoError(input.prontuarioId);
    }

    const evolucao = Evolucao.criarRegistro({
      id: randomUUID(),
      clinicaId: input.clinicaId,
      prontuarioId: prontuario.id,
      profissionalId: solicitante.id,
      descricao: input.descricao,
      procedimentoId: input.procedimentoId,
    });

    await this.evolucaoRepo.salvar(evolucao);
    await registrarAuditoriaEscrita({
      auditoria: this.auditoria,
      clinicaId: input.clinicaId,
      solicitante,
      recursoTipo: "evolucao",
      recursoId: evolucao.id,
      pacienteId: prontuario.pacienteId,
      detalhe: { evolucaoId: evolucao.id },
    });

    return evolucao;
  }
}
