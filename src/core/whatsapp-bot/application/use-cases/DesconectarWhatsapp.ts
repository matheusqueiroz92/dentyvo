import type { ProfissionalRepositoryPort } from "@/core/auth/application/ports/ProfissionalRepositoryPort";

import { ContaWhatsappNaoEncontradaError } from "../../domain/errors";
import type { ClinicWhatsappAccountRepositoryPort } from "../ports/ClinicWhatsappAccountRepositoryPort";
import { autorizar, obterSolicitanteNaClinica } from "./helpers";

export type DesconectarWhatsappInput = {
  clinicaId: string;
  solicitadoPorUsuarioId: string;
};

/**
 * Desconecta a conta WhatsApp da clínica (status `desconectado`, limpa token).
 *
 * Assinatura: `DesconectarWhatsapp(clinicaId) → void`
 */
export class DesconectarWhatsapp {
  constructor(
    private readonly contaRepo: ClinicWhatsappAccountRepositoryPort,
    private readonly profissionalRepo: ProfissionalRepositoryPort,
  ) {}

  async executar(input: DesconectarWhatsappInput): Promise<void> {
    const solicitante = await obterSolicitanteNaClinica(
      this.profissionalRepo,
      input.solicitadoPorUsuarioId,
      input.clinicaId,
    );
    autorizar(solicitante, "desconectar_whatsapp");

    const conta = await this.contaRepo.buscarPorClinicaId(input.clinicaId);
    if (!conta) {
      throw new ContaWhatsappNaoEncontradaError(input.clinicaId);
    }

    await this.contaRepo.salvar(conta.desconectar());
  }
}
