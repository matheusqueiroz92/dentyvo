import type { ConteudoNotificacao } from "@/core/notificacao/domain/ConteudoNotificacao";
import type { NotificacaoDashboardDTO } from "@/lib/dashboard/types";

import { rotuloTipoNotificacao } from "./rotulo-tipo";

export function notificacaoParaDashboardDTO(n: {
  id: string;
  tipo: string;
  conteudo: ConteudoNotificacao;
  criadaEm: Date;
}): NotificacaoDashboardDTO {
  return {
    id: n.id,
    tipo: n.tipo,
    titulo: n.conteudo.titulo ?? rotuloTipoNotificacao(n.tipo),
    mensagem: n.conteudo.mensagem ?? "",
    criadaEmIso: n.criadaEm.toISOString(),
    linkAcao: n.conteudo.linkAcao ?? null,
    planoNome: n.conteudo.planoNome ?? null,
    dataReferenciaIso: n.conteudo.dataReferenciaIso ?? null,
    valorCentavos: n.conteudo.valorCentavos ?? null,
  };
}
