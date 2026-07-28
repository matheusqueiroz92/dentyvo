import { randomUUID } from "node:crypto";

import type { ProfissionalRepositoryPort } from "@/core/auth/application/ports/ProfissionalRepositoryPort";
import { DadosInvalidosError } from "@/core/shared/errors";

import { ClinicWhatsappAccount } from "../../domain/ClinicWhatsappAccount";
import { CodigoOAuthInvalidoError } from "../../domain/errors";
import type { ClinicWhatsappAccountRepositoryPort } from "../ports/ClinicWhatsappAccountRepositoryPort";
import type { CriptografiaPort } from "../ports/CriptografiaPort";
import type { MetaGraphApiPort } from "../ports/MetaGraphApiPort";
import { autorizar, obterSolicitanteNaClinica } from "./helpers";

export type ConcluirConexaoWhatsappInput = {
  clinicaId: string;
  solicitadoPorUsuarioId: string;
  codigoOAuth: string;
};

/**
 * Troca o código OAuth por token de longa duração, persiste a conta
 * `conectado` (token criptografado) e inscreve o webhook (spec 008).
 *
 * Assinatura: `ConcluirConexaoWhatsapp(clinicaId, codigoOAuth) → ClinicWhatsappAccount`
 *
 * Código inválido: não deixa a conta em `conectado`; se já existir registro,
 * permanece/volta a `pendente` e lança `CodigoOAuthInvalidoError`.
 */
export class ConcluirConexaoWhatsapp {
  constructor(
    private readonly contaRepo: ClinicWhatsappAccountRepositoryPort,
    private readonly metaGraph: MetaGraphApiPort,
    private readonly criptografia: CriptografiaPort,
    private readonly profissionalRepo: ProfissionalRepositoryPort,
  ) {}

  async executar(
    input: ConcluirConexaoWhatsappInput,
  ): Promise<ClinicWhatsappAccount> {
    const solicitante = await obterSolicitanteNaClinica(
      this.profissionalRepo,
      input.solicitadoPorUsuarioId,
      input.clinicaId,
    );
    autorizar(solicitante, "concluir_conexao_whatsapp");

    const codigoOAuth = input.codigoOAuth.trim();
    if (!codigoOAuth) {
      throw new DadosInvalidosError("Código OAuth é obrigatório.");
    }

    let existente = await this.contaRepo.buscarPorClinicaId(input.clinicaId);
    if (existente == null) {
      existente = ClinicWhatsappAccount.criarPendente({
        id: randomUUID(),
        clinicaId: input.clinicaId,
      });
      await this.contaRepo.salvar(existente);
    }

    let troca;
    try {
      troca = await this.metaGraph.trocarCodigoPorToken(codigoOAuth);
    } catch (erro) {
      const pendente = existente.marcarPendente();
      await this.contaRepo.salvar(pendente);
      if (erro instanceof CodigoOAuthInvalidoError) {
        throw erro;
      }
      throw new CodigoOAuthInvalidoError();
    }

    const accessTokenCriptografado = await this.criptografia.criptografar(
      troca.accessToken,
    );

    await this.metaGraph.inscreverWebhook({
      phoneNumberId: troca.phoneNumberId,
      accessToken: troca.accessToken,
    });

    const conectada = existente.concluirConexao({
      wabaId: troca.wabaId,
      phoneNumberId: troca.phoneNumberId,
      accessTokenCriptografado,
      tokenExpiraEm: troca.expiraEm,
    });

    await this.contaRepo.salvar(conectada);
    return conectada;
  }
}
