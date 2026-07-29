import {
  AssinaturaNaoEncontradaError,
  PlanoNaoEncontradoError,
} from "../../domain/errors";
import { valorMensalPlanoEmCentavos } from "../../domain/elegibilidadePromocional";
import type { AssinaturaRepositoryPort } from "../ports/AssinaturaRepositoryPort";
import type { PlanoRepositoryPort } from "../ports/PlanoRepositoryPort";

export type OrigemValorCobranca = "promocional" | "cheio";

export type ResolverValorCobrancaAssinaturaInput = {
  assinaturaId: string;
  agora?: Date;
};

export type ResolverValorCobrancaAssinaturaResultado = {
  valorCentavos: number;
  origem: OrigemValorCobranca;
};

/**
 * Resolve o valor a cobrar: override promocional vigente ou `Plano.valorMensal`
 * (spec 012, D9).
 */
export class ResolverValorCobrancaAssinatura {
  constructor(
    private readonly assinaturaRepo: AssinaturaRepositoryPort,
    private readonly planoRepo: PlanoRepositoryPort,
  ) {}

  async executar(
    input: ResolverValorCobrancaAssinaturaInput,
  ): Promise<ResolverValorCobrancaAssinaturaResultado> {
    const agora = input.agora ?? new Date();
    const assinatura = await this.assinaturaRepo.buscarPorId(input.assinaturaId);
    if (!assinatura) {
      throw new AssinaturaNaoEncontradaError(input.assinaturaId);
    }

    if (
      assinatura.temPrecoPromocionalAtivo(agora) &&
      assinatura.precoPromocionalCentavos != null
    ) {
      return {
        valorCentavos: assinatura.precoPromocionalCentavos,
        origem: "promocional",
      };
    }

    if (!assinatura.planoId) {
      throw new PlanoNaoEncontradoError("(sem plano)");
    }
    const plano = await this.planoRepo.buscarPorId(assinatura.planoId);
    if (!plano) {
      throw new PlanoNaoEncontradoError(assinatura.planoId);
    }

    return {
      valorCentavos: valorMensalPlanoEmCentavos(plano),
      origem: "cheio",
    };
  }
}
