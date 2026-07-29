import type { Assinatura } from "../../domain/Assinatura";
import type { VagaPromocional } from "../../domain/VagaPromocional";
import {
  AssinaturaNaoEncontradaError,
  PlanoNaoEncontradoError,
} from "../../domain/errors";
import { precoPromocionalCentavosParaPlano } from "../../domain/elegibilidadePromocional";
import { DadosInvalidosError } from "@/core/shared/errors";
import type { AssinaturaRepositoryPort } from "../ports/AssinaturaRepositoryPort";
import type { PlanoRepositoryPort } from "../ports/PlanoRepositoryPort";

export type AplicarPrecoPromocionalNaAssinaturaInput = {
  assinaturaId: string;
  /** Fonte de verdade da reserva (D6). */
  vaga: VagaPromocional;
  planoId: string;
};

/**
 * Copia `precoPromocionalCentavos` + `precoPromocionalAte` na Assinatura
 * a partir da `VagaPromocional` (spec 012, D6).
 */
export class AplicarPrecoPromocionalNaAssinatura {
  constructor(
    private readonly assinaturaRepo: AssinaturaRepositoryPort,
    private readonly planoRepo: PlanoRepositoryPort,
  ) {}

  async executar(
    input: AplicarPrecoPromocionalNaAssinaturaInput,
  ): Promise<Assinatura> {
    const assinatura = await this.assinaturaRepo.buscarPorId(input.assinaturaId);
    if (!assinatura) {
      throw new AssinaturaNaoEncontradaError(input.assinaturaId);
    }

    const plano = await this.planoRepo.buscarPorId(input.planoId);
    if (!plano) {
      throw new PlanoNaoEncontradoError(input.planoId);
    }

    const centavos = precoPromocionalCentavosParaPlano(plano);
    if (centavos == null) {
      throw new DadosInvalidosError(
        "Plano não elegível para aplicar preço promocional.",
      );
    }

    const atualizada = assinatura.aplicarCopiaPromocionalDaVaga({
      vaga: input.vaga,
      precoPromocionalCentavos: centavos,
    });
    await this.assinaturaRepo.salvar(atualizada);
    return atualizada;
  }
}
