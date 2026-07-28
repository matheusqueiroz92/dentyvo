import type { ClinicWhatsappAccount } from "../../domain/ClinicWhatsappAccount";

/**
 * Persistência da conta WhatsApp por clínica (spec 008).
 * Uma clínica tem no máximo uma conta — `salvar` faz upsert por `clinicaId`.
 */
export interface ClinicWhatsappAccountRepositoryPort {
  salvar(conta: ClinicWhatsappAccount): Promise<void>;

  /** Escopado por tenant. */
  buscarPorClinicaId(clinicaId: string): Promise<ClinicWhatsappAccount | null>;

  /**
   * Resolução cross-tenant pelo id Meta (webhook compartilhado).
   * Retorna null se não houver conta — caller deve descartar com log.
   */
  buscarPorPhoneNumberId(
    phoneNumberId: string,
  ): Promise<ClinicWhatsappAccount | null>;

  /** Contas conectadas cuja expiração está dentro da janela de renovação. */
  listarConectadasComTokenExpirandoAte(
    limiteExpiracao: Date,
  ): Promise<ClinicWhatsappAccount[]>;
}
