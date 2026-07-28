import { randomUUID } from "node:crypto";

import type { ProfissionalRepositoryPort } from "@/core/auth/application/ports/ProfissionalRepositoryPort";
import { ProfissionalNaoEncontradoError } from "@/core/auth/domain/errors";

import {
  assertJanelasSemSobreposicao,
  DisponibilidadeProfissional,
} from "../../domain/DisponibilidadeProfissional";
import type { DisponibilidadeProfissionalRepositoryPort } from "../ports/DisponibilidadeProfissionalRepositoryPort";
import { autorizar, obterSolicitanteNaClinica } from "./helpers";

export type JanelaDisponibilidadeInput = {
  diaDaSemana: number;
  horaInicio: string;
  horaFim: string;
};

export type DefinirDisponibilidadeProfissionalInput = {
  clinicaId: string;
  solicitadoPorUsuarioId: string;
  profissionalId: string;
  janelas: JanelaDisponibilidadeInput[];
};

/**
 * Define (substitui) a grade semanal de disponibilidade do profissional.
 * RBAC: admin | dentista (spec 002).
 */
export class DefinirDisponibilidadeProfissional {
  constructor(
    private readonly disponibilidadeRepo: DisponibilidadeProfissionalRepositoryPort,
    private readonly profissionalRepo: ProfissionalRepositoryPort,
  ) {}

  async executar(
    input: DefinirDisponibilidadeProfissionalInput,
  ): Promise<DisponibilidadeProfissional[]> {
    const solicitante = await obterSolicitanteNaClinica(
      this.profissionalRepo,
      input.solicitadoPorUsuarioId,
      input.clinicaId,
    );
    autorizar(solicitante, "definir_disponibilidade");

    const profissional = await this.profissionalRepo.buscarPorId(
      input.clinicaId,
      input.profissionalId,
    );
    if (!profissional) {
      throw new ProfissionalNaoEncontradoError(input.profissionalId);
    }

    const janelas = input.janelas.map((j) =>
      DisponibilidadeProfissional.criar({
        id: randomUUID(),
        clinicaId: input.clinicaId,
        profissionalId: input.profissionalId,
        diaDaSemana: j.diaDaSemana,
        horaInicio: j.horaInicio,
        horaFim: j.horaFim,
      }),
    );
    assertJanelasSemSobreposicao(janelas);

    await this.disponibilidadeRepo.substituirJanelas(
      input.clinicaId,
      input.profissionalId,
      janelas,
    );
    return janelas;
  }
}
