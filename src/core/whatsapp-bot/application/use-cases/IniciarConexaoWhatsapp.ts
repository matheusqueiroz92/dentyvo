import { randomUUID } from "node:crypto";

import type { ProfissionalRepositoryPort } from "@/core/auth/application/ports/ProfissionalRepositoryPort";

import { ClinicWhatsappAccount } from "../../domain/ClinicWhatsappAccount";
import {
  ConfiguracaoPopup,
  type ConfiguracaoPopupProps,
} from "../../domain/ConfiguracaoPopup";
import type { ClinicWhatsappAccountRepositoryPort } from "../ports/ClinicWhatsappAccountRepositoryPort";
import { autorizar, obterSolicitanteNaClinica } from "./helpers";

export type IniciarConexaoWhatsappInput = {
  clinicaId: string;
  solicitadoPorUsuarioId: string;
};

/**
 * Prepara o Embedded Signup: autoriza admin, garante conta `pendente` e
 * devolve o que o frontend precisa para abrir o popup (spec 008).
 *
 * Assinatura: `IniciarConexaoWhatsapp(clinicaId) → ConfiguracaoPopup`
 */
export class IniciarConexaoWhatsapp {
  constructor(
    private readonly contaRepo: ClinicWhatsappAccountRepositoryPort,
    private readonly profissionalRepo: ProfissionalRepositoryPort,
    private readonly configuracaoPlataforma: ConfiguracaoPopupProps,
  ) {}

  async executar(
    input: IniciarConexaoWhatsappInput,
  ): Promise<ConfiguracaoPopup> {
    const solicitante = await obterSolicitanteNaClinica(
      this.profissionalRepo,
      input.solicitadoPorUsuarioId,
      input.clinicaId,
    );
    autorizar(solicitante, "iniciar_conexao_whatsapp");

    const existente = await this.contaRepo.buscarPorClinicaId(input.clinicaId);
    const conta =
      existente == null
        ? ClinicWhatsappAccount.criarPendente({
            id: randomUUID(),
            clinicaId: input.clinicaId,
          })
        : existente.marcarPendente();

    await this.contaRepo.salvar(conta);

    return ConfiguracaoPopup.criar(this.configuracaoPlataforma);
  }
}
