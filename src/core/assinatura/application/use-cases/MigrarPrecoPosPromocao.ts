import type { Assinatura } from "../../domain/Assinatura";
import {
  AssinaturaNaoEncontradaError,
  PlanoNaoEncontradoError,
} from "../../domain/errors";
import type { AssinaturaGatewayPort } from "../ports/AssinaturaGatewayPort";
import type { AssinaturaRepositoryPort } from "../ports/AssinaturaRepositoryPort";
import type { PlanoRepositoryPort } from "../ports/PlanoRepositoryPort";

export type MigrarPrecoPosPromocaoInput = {
  assinaturaId: string;
  agora?: Date;
};

export type MigrarPrecoPosPromocaoResultado =
  | { status: "migrada"; assinatura: Assinatura }
  | {
      status: "noop";
      motivo: "ja_migrada" | "ainda_na_promocao" | "sem_promocao";
    };

/**
 * Quando `agora >= precoPromocionalAte`, atualiza o valor recorrente no
 * gateway para o preço cheio do plano (spec 012, T3).
 *
 * Idempotência via `migradaParaPrecoCheioEm`.
 */
export class MigrarPrecoPosPromocao {
  constructor(
    private readonly assinaturaRepo: AssinaturaRepositoryPort,
    private readonly planoRepo: PlanoRepositoryPort,
    private readonly gateway: AssinaturaGatewayPort,
  ) {}

  async executar(
    input: MigrarPrecoPosPromocaoInput,
  ): Promise<MigrarPrecoPosPromocaoResultado> {
    const agora = input.agora ?? new Date();
    const assinatura = await this.assinaturaRepo.buscarPorId(input.assinaturaId);
    if (!assinatura) {
      throw new AssinaturaNaoEncontradaError(input.assinaturaId);
    }

    if (assinatura.jaMigradaParaPrecoCheio()) {
      return { status: "noop", motivo: "ja_migrada" };
    }

    if (!assinatura.temCopiaPromocional() || assinatura.precoPromocionalAte == null) {
      return { status: "noop", motivo: "sem_promocao" };
    }

    if (agora.getTime() < assinatura.precoPromocionalAte.getTime()) {
      return { status: "noop", motivo: "ainda_na_promocao" };
    }

    if (!assinatura.planoId || !assinatura.gatewayAssinaturaId) {
      throw new PlanoNaoEncontradoError(assinatura.planoId ?? "(sem plano)");
    }

    const plano = await this.planoRepo.buscarPorId(assinatura.planoId);
    if (!plano) {
      throw new PlanoNaoEncontradoError(assinatura.planoId);
    }

    await this.gateway.atualizarValorAssinatura({
      gatewayAssinaturaId: assinatura.gatewayAssinaturaId,
      valorMensal: plano.valorMensal,
    });

    const migrada = assinatura.marcarMigradaParaPrecoCheio(agora);
    await this.assinaturaRepo.salvar(migrada);
    return { status: "migrada", assinatura: migrada };
  }
}
