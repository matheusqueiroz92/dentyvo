import { randomUUID } from "node:crypto";

import type { ProfissionalRepositoryPort } from "@/core/auth/application/ports/ProfissionalRepositoryPort";
import type { ProntuarioRepositoryPort } from "@/core/prontuario/application/ports/ProntuarioRepositoryPort";
import { ProntuarioNaoEncontradoError } from "@/core/prontuario/domain/errors";

import type { DentePeriogramaCriarInput } from "../../domain/DentePeriograma";
import { Periograma } from "../../domain/Periograma";
import type { PeriogramaRepositoryPort } from "../ports/PeriogramaRepositoryPort";
import { autorizar, obterSolicitanteNaClinica } from "./helpers";

/**
 * Input de negócio: sem `profissionalId`.
 * Delivery mapeia `ContextoSessao` → `clinicaId` + `solicitadoPorUsuarioId`;
 * o caso de uso usa `solicitante.id` como `profissionalId` do exame.
 */
export type RegistrarPeriogramaInput = {
  clinicaId: string;
  solicitadoPorUsuarioId: string;
  prontuarioId: string;
  tipo: string;
  dentes?: DentePeriogramaCriarInput[];
};

/**
 * Registra periograma imutável vinculado ao prontuário (spec 005).
 * Correção = novo exame `reavaliacao` (sem update in-place).
 */
export class RegistrarPeriograma {
  constructor(
    private readonly periogramaRepo: PeriogramaRepositoryPort,
    private readonly prontuarioRepo: ProntuarioRepositoryPort,
    private readonly profissionalRepo: ProfissionalRepositoryPort,
  ) {}

  async executar(input: RegistrarPeriogramaInput): Promise<Periograma> {
    const solicitante = await obterSolicitanteNaClinica(
      this.profissionalRepo,
      input.solicitadoPorUsuarioId,
      input.clinicaId,
    );
    autorizar(solicitante, "registrar_periograma");

    const prontuario = await this.prontuarioRepo.buscarPorId(
      input.clinicaId,
      input.prontuarioId,
    );
    if (!prontuario) {
      throw new ProntuarioNaoEncontradoError(input.prontuarioId);
    }

    const periograma = Periograma.registrar({
      id: randomUUID(),
      clinicaId: input.clinicaId,
      prontuarioId: prontuario.id,
      profissionalId: solicitante.id,
      tipo: input.tipo,
      dentes: input.dentes,
    });

    await this.periogramaRepo.salvar(periograma);
    return periograma;
  }
}
