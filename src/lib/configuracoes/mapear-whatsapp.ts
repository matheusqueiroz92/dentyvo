import type { StatusConexaoWhatsapp } from "@/core/whatsapp-bot/application/use-cases";

import type { StatusWhatsappDTO } from "./whatsapp-types";

function isoOuNull(data: Date | null): string | null {
  return data ? data.toISOString() : null;
}

export function statusWhatsappParaDto(
  status: StatusConexaoWhatsapp,
): StatusWhatsappDTO {
  return {
    status: status.status,
    phoneNumberId: status.phoneNumberId,
    conectadoEmIso: isoOuNull(status.conectadoEm),
    tokenExpiraEmIso: isoOuNull(status.tokenExpiraEm),
  };
}
