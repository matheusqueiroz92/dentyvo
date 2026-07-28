import { randomUUID } from "node:crypto";

import type { ProfissionalRepositoryPort } from "@/core/auth/application/ports/ProfissionalRepositoryPort";
import type { AuditoriaLogPort } from "@/core/prontuario/application/ports/AuditoriaLogPort";
import type { ProntuarioRepositoryPort } from "@/core/prontuario/application/ports/ProntuarioRepositoryPort";
import { ProntuarioNaoEncontradoError } from "@/core/prontuario/domain/errors";

import { Anamnese } from "../../domain/Anamnese";
import { AnamneseJaPreenchidaError } from "../../domain/errors";
import type { RespostasAnamneseProps } from "../../domain/RespostasAnamnese";
import type { AnamneseRepositoryPort } from "../ports/AnamneseRepositoryPort";
import {
  autorizar,
  obterSolicitanteNaClinica,
  registrarAuditoriaEscritaAnamnese,
} from "./helpers";

export type PreencherAnamneseInput = {
  clinicaId: string;
  solicitadoPorUsuarioId: string;
  prontuarioId: string;
  respostas: RespostasAnamneseProps;
};

/**
 * Primeira versão (snapshot) da anamnese do prontuário (spec 003).
 */
export class PreencherAnamnese {
  constructor(
    private readonly anamneseRepo: AnamneseRepositoryPort,
    private readonly prontuarioRepo: ProntuarioRepositoryPort,
    private readonly profissionalRepo: ProfissionalRepositoryPort,
    private readonly auditoria: AuditoriaLogPort,
  ) {}

  async executar(input: PreencherAnamneseInput): Promise<Anamnese> {
    const solicitante = await obterSolicitanteNaClinica(
      this.profissionalRepo,
      input.solicitadoPorUsuarioId,
      input.clinicaId,
    );
    autorizar(solicitante, "escrever_anamnese");

    const prontuario = await this.prontuarioRepo.buscarPorId(
      input.clinicaId,
      input.prontuarioId,
    );
    if (!prontuario) {
      throw new ProntuarioNaoEncontradoError(input.prontuarioId);
    }

    const vigente = await this.anamneseRepo.buscarVersaoVigente(
      input.clinicaId,
      prontuario.id,
    );
    if (vigente) {
      throw new AnamneseJaPreenchidaError(prontuario.id);
    }

    const anamnese = Anamnese.criarInicial({
      id: randomUUID(),
      clinicaId: input.clinicaId,
      prontuarioId: prontuario.id,
      respostas: input.respostas,
      preenchidoPorProfissionalId: solicitante.id,
    });

    await this.anamneseRepo.salvar(anamnese);
    await registrarAuditoriaEscritaAnamnese({
      auditoria: this.auditoria,
      clinicaId: input.clinicaId,
      solicitante,
      anamneseId: anamnese.id,
      pacienteId: prontuario.pacienteId,
      detalhe: { versaoAnamnese: anamnese.versao },
    });

    return anamnese;
  }
}
