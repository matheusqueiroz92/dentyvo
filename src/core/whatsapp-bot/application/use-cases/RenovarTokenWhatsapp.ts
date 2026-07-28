import { ANTECEDENCIA_RENOVACAO_TOKEN_MS } from "../../domain/constants";
import {
  ContaWhatsappNaoEncontradaError,
  TokenWhatsappInvalidoError,
} from "../../domain/errors";
import type { ClinicWhatsappAccountRepositoryPort } from "../ports/ClinicWhatsappAccountRepositoryPort";
import type { CriptografiaPort } from "../ports/CriptografiaPort";
import type { MetaGraphApiPort } from "../ports/MetaGraphApiPort";

export type RenovarTokenWhatsappInput = {
  clinicaId: string;
  /** Instantâneo do job; default = agora. */
  agora?: Date;
  /** Override da antecedência; default = `ANTECEDENCIA_RENOVACAO_TOKEN_MS`. */
  antecedenciaMs?: number;
};

/**
 * Job periódico: renova o token antes da expiração (spec 008).
 * Sem RBAC de papel de clínica — ator é o scheduler, não um `Profissional`.
 *
 * Assinatura: `RenovarTokenWhatsapp(clinicaId) → void`
 *
 * Token revogado/inválido na Meta → invalida a conta (`desconectado`).
 */
export class RenovarTokenWhatsapp {
  constructor(
    private readonly contaRepo: ClinicWhatsappAccountRepositoryPort,
    private readonly metaGraph: MetaGraphApiPort,
    private readonly criptografia: CriptografiaPort,
  ) {}

  async executar(input: RenovarTokenWhatsappInput): Promise<void> {
    const agora = input.agora ?? new Date();
    const antecedenciaMs =
      input.antecedenciaMs ?? ANTECEDENCIA_RENOVACAO_TOKEN_MS;

    const conta = await this.contaRepo.buscarPorClinicaId(input.clinicaId);
    if (!conta) {
      throw new ContaWhatsappNaoEncontradaError(input.clinicaId);
    }

    if (!conta.precisaRenovarToken(agora, antecedenciaMs)) {
      return;
    }

    if (!conta.accessTokenCriptografado) {
      await this.contaRepo.salvar(conta.invalidarPorTokenExpiradoOuRevogado());
      throw new TokenWhatsappInvalidoError(input.clinicaId);
    }

    try {
      const textoPlano = await this.criptografia.descriptografar(
        conta.accessTokenCriptografado,
      );
      const renovado = await this.metaGraph.renovarToken(textoPlano);
      const accessTokenCriptografado = await this.criptografia.criptografar(
        renovado.accessToken,
      );
      await this.contaRepo.salvar(
        conta.renovarToken({
          accessTokenCriptografado,
          tokenExpiraEm: renovado.expiraEm,
        }),
      );
    } catch {
      await this.contaRepo.salvar(conta.invalidarPorTokenExpiradoOuRevogado());
      throw new TokenWhatsappInvalidoError(input.clinicaId);
    }
  }
}
