import type { VagaPromocional } from "../../domain/VagaPromocional";
import {
  planoElegivelParaPromocao,
} from "../../domain/elegibilidadePromocional";
import {
  PlanoNaoEncontradoError,
  VagasPromocionaisEsgotadasError,
} from "../../domain/errors";
import type { PlanoRepositoryPort } from "../ports/PlanoRepositoryPort";
import type { VagaPromocionalRepositoryPort } from "../ports/VagaPromocionalRepositoryPort";

export type ReservarVagaPromocionalInput = {
  clinicaId: string;
  assinaturaId: string;
  planoId: string;
  agora?: Date;
};

/**
 * Reserva atômica de vaga do cupom de lançamento (spec 012, D3 / D8).
 *
 * - Plano não elegível (ex.: Full) → `null` (não consome vaga — D2)
 * - Vagas esgotadas → `null` (assinatura segue pelo preço cheio)
 * - Sucesso / clínica já possui vaga → `VagaPromocional`
 */
export class ReservarVagaPromocional {
  constructor(
    private readonly vagaRepo: VagaPromocionalRepositoryPort,
    private readonly planoRepo: PlanoRepositoryPort,
  ) {}

  async executar(
    input: ReservarVagaPromocionalInput,
  ): Promise<VagaPromocional | null> {
    const plano = await this.planoRepo.buscarPorId(input.planoId);
    if (!plano) {
      throw new PlanoNaoEncontradoError(input.planoId);
    }

    if (!planoElegivelParaPromocao(plano)) {
      return null;
    }

    const agora = input.agora ?? new Date();
    try {
      return await this.vagaRepo.reservarAtomico({
        clinicaId: input.clinicaId,
        assinaturaId: input.assinaturaId,
        agora,
      });
    } catch (error) {
      if (error instanceof VagasPromocionaisEsgotadasError) {
        return null;
      }
      throw error;
    }
  }
}
