import { ANTECEDENCIA_RENOVACAO_TOKEN_MS } from "../../domain/constants";
import type { ClinicWhatsappAccountRepositoryPort } from "../ports/ClinicWhatsappAccountRepositoryPort";
import type { RenovarTokenWhatsapp } from "./RenovarTokenWhatsapp";

export type ProcessarRenovacaoTokensWhatsappInput = {
  /** Instantâneo do job; default = agora. */
  agora?: Date;
  /** Override da antecedência; default = `ANTECEDENCIA_RENOVACAO_TOKEN_MS`. */
  antecedenciaMs?: number;
};

export type ProcessarRenovacaoTokensWhatsappResultado = {
  processados: number;
  renovados: number;
  falhas: number;
};

/**
 * Job em lote da renovação de token (spec 008, decisão 3): lista as contas
 * `conectado` cuja expiração entra na janela de antecedência e delega cada
 * clínica a `RenovarTokenWhatsapp`.
 *
 * Ator é o scheduler — sem RBAC de `Profissional`.
 *
 * Falha em uma clínica não interrompe o lote: `RenovarTokenWhatsapp` já
 * marca a conta como `desconectado` quando a Meta rejeita o token, e aqui só
 * contabilizamos para o cron reportar o resultado.
 */
export class ProcessarRenovacaoTokensWhatsapp {
  constructor(
    private readonly contaRepo: ClinicWhatsappAccountRepositoryPort,
    private readonly renovarToken: RenovarTokenWhatsapp,
  ) {}

  async executar(
    input: ProcessarRenovacaoTokensWhatsappInput = {},
  ): Promise<ProcessarRenovacaoTokensWhatsappResultado> {
    const agora = input.agora ?? new Date();
    const antecedenciaMs =
      input.antecedenciaMs ?? ANTECEDENCIA_RENOVACAO_TOKEN_MS;

    const limiteExpiracao = new Date(agora.getTime() + antecedenciaMs);
    const candidatas =
      await this.contaRepo.listarConectadasComTokenExpirandoAte(
        limiteExpiracao,
      );

    let renovados = 0;
    let falhas = 0;

    for (const conta of candidatas) {
      try {
        await this.renovarToken.executar({
          clinicaId: conta.clinicaId,
          agora,
          antecedenciaMs,
        });
        renovados += 1;
      } catch (erro) {
        falhas += 1;
        console.warn("[whatsapp:renovacao-token] falha ao renovar", {
          clinicaId: conta.clinicaId,
          erro: erro instanceof Error ? erro.name : "desconhecido",
        });
      }
    }

    return { processados: candidatas.length, renovados, falhas };
  }
}
