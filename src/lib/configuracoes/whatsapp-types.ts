import type { StatusClinicWhatsappAccount } from "@/core/whatsapp-bot/domain/StatusClinicWhatsappAccount";

/**
 * Projeção do status da conexão WhatsApp para o cliente.
 * Nunca carrega o access token — nem em texto plano, nem cifrado.
 */
export type StatusWhatsappDTO = {
  status: StatusClinicWhatsappAccount;
  phoneNumberId: string | null;
  conectadoEmIso: string | null;
  tokenExpiraEmIso: string | null;
};

/** Dados públicos que o browser precisa para abrir o Embedded Signup. */
export type ConfiguracaoPopupWhatsappDTO = {
  appId: string;
  configurationId: string;
  /** Espelha `META_GRAPH_API_VERSION` para o SDK não divergir do servidor. */
  graphApiVersion: string;
};
