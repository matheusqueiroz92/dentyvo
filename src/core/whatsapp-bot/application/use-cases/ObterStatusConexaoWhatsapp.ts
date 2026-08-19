import type { ProfissionalRepositoryPort } from "@/core/auth/application/ports/ProfissionalRepositoryPort";

import type { StatusClinicWhatsappAccount } from "../../domain/StatusClinicWhatsappAccount";
import type { ClinicWhatsappAccountRepositoryPort } from "../ports/ClinicWhatsappAccountRepositoryPort";
import { autorizar, obterSolicitanteNaClinica } from "./helpers";

export type ObterStatusConexaoWhatsappInput = {
  clinicaId: string;
  solicitadoPorUsuarioId: string;
};

/**
 * Projeção segura para o painel: nunca inclui o token, nem cifrado.
 */
export type StatusConexaoWhatsapp = {
  status: StatusClinicWhatsappAccount;
  phoneNumberId: string | null;
  conectadoEm: Date | null;
  tokenExpiraEm: Date | null;
};

/**
 * Status da conexão WhatsApp da clínica para exibição no painel (spec 008).
 *
 * Clínica que nunca conectou é reportada como `desconectado` — do ponto de
 * vista do painel, "sem conta" e "conta desconectada" são o mesmo estado.
 */
export class ObterStatusConexaoWhatsapp {
  constructor(
    private readonly contaRepo: ClinicWhatsappAccountRepositoryPort,
    private readonly profissionalRepo: ProfissionalRepositoryPort,
  ) {}

  async executar(
    input: ObterStatusConexaoWhatsappInput,
  ): Promise<StatusConexaoWhatsapp> {
    const solicitante = await obterSolicitanteNaClinica(
      this.profissionalRepo,
      input.solicitadoPorUsuarioId,
      input.clinicaId,
    );
    autorizar(solicitante, "ver_status_whatsapp");

    const conta = await this.contaRepo.buscarPorClinicaId(input.clinicaId);
    if (conta == null) {
      return {
        status: "desconectado",
        phoneNumberId: null,
        conectadoEm: null,
        tokenExpiraEm: null,
      };
    }

    conta.assertPertenceAClinica(input.clinicaId);

    return {
      status: conta.status,
      phoneNumberId: conta.phoneNumberId,
      conectadoEm: conta.conectadoEm,
      tokenExpiraEm: conta.tokenExpiraEm,
    };
  }
}
