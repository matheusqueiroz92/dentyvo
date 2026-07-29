import type { NotificacaoCanalPort } from "../../application/ports/NotificacaoCanalPort";
import type { ConteudoNotificacao } from "../../domain/ConteudoNotificacao";
import type { DestinatarioNotificacao } from "../../domain/DestinatarioNotificacao";
import type {
  CanalNotificacao,
  TipoNotificacao,
} from "../../domain/StatusEnvio";

import { EmailNotificacaoCanalAdapter } from "./EmailNotificacaoCanalAdapter";
import { InAppNotificacaoCanalAdapter } from "./InAppNotificacaoCanalAdapter";

/**
 * Roteia `despachar` para o adapter do canal solicitado.
 * `EnviarNotificacao` injeta uma única `NotificacaoCanalPort`.
 */
export class CompositeNotificacaoCanalAdapter implements NotificacaoCanalPort {
  constructor(
    private readonly email: NotificacaoCanalPort = new EmailNotificacaoCanalAdapter(),
    private readonly inApp: NotificacaoCanalPort = new InAppNotificacaoCanalAdapter(),
  ) {}

  async despachar(input: {
    canal: CanalNotificacao;
    destinatario: DestinatarioNotificacao;
    tipo: TipoNotificacao;
    conteudo: ConteudoNotificacao;
    notificacaoId: string;
  }): Promise<void> {
    if (input.canal === "email") {
      return this.email.despachar(input);
    }
    if (input.canal === "in_app") {
      return this.inApp.despachar(input);
    }
    throw new Error(`Canal de notificação não suportado: ${input.canal}`);
  }
}
