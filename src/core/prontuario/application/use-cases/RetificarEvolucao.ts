import { randomUUID } from "node:crypto";

import type { ProfissionalRepositoryPort } from "@/core/auth/application/ports/ProfissionalRepositoryPort";

import { Evolucao } from "../../domain/Evolucao";
import {
  EvolucaoJaRetificadaError,
  EvolucaoNaoEncontradaError,
} from "../../domain/errors";
import type { AuditoriaLogPort } from "../ports/AuditoriaLogPort";
import type { EvolucaoRepositoryPort } from "../ports/EvolucaoRepositoryPort";
import {
  autorizarComAuditoria,
  registrarAuditoriaEscrita,
} from "./helpers";

export type RetificarEvolucaoInput = {
  clinicaId: string;
  solicitadoPorUsuarioId: string;
  evolucaoId: string;
  descricao: string;
  motivoRetificacao: string;
};

/**
 * Retifica evolução original com novo registro (MVP: uma retificação por
 * original; não retifica retificação) — spec 003.
 */
export class RetificarEvolucao {
  constructor(
    private readonly evolucaoRepo: EvolucaoRepositoryPort,
    private readonly profissionalRepo: ProfissionalRepositoryPort,
    private readonly auditoria: AuditoriaLogPort,
  ) {}

  async executar(input: RetificarEvolucaoInput): Promise<Evolucao> {
    const solicitante = await autorizarComAuditoria({
      profissionalRepo: this.profissionalRepo,
      auditoria: this.auditoria,
      clinicaId: input.clinicaId,
      solicitadoPorUsuarioId: input.solicitadoPorUsuarioId,
      acao: "retificar_evolucao",
      recursoTipo: "evolucao",
      recursoId: input.evolucaoId,
    });

    const original = await this.evolucaoRepo.buscarPorId(
      input.clinicaId,
      input.evolucaoId,
    );
    if (!original) {
      throw new EvolucaoNaoEncontradaError(input.evolucaoId);
    }

    const jaRetificada = await this.evolucaoRepo.buscarRetificacaoPorOriginal(
      input.clinicaId,
      original.id,
    );
    if (jaRetificada) {
      throw new EvolucaoJaRetificadaError(original.id);
    }

    const retificacao = Evolucao.criarRetificacao({
      id: randomUUID(),
      original,
      profissionalId: solicitante.id,
      descricao: input.descricao,
      motivoRetificacao: input.motivoRetificacao,
    });

    await this.evolucaoRepo.salvar(retificacao);
    await registrarAuditoriaEscrita({
      auditoria: this.auditoria,
      clinicaId: input.clinicaId,
      solicitante,
      recursoTipo: "evolucao",
      recursoId: retificacao.id,
      detalhe: {
        evolucaoId: retificacao.id,
        evolucaoRetificadaId: original.id,
      },
    });

    return retificacao;
  }
}
