import type { NotificacaoCanalPort } from "../../application/ports/NotificacaoCanalPort";
import type { ConteudoNotificacao } from "../../domain/ConteudoNotificacao";
import type { DestinatarioNotificacao } from "../../domain/DestinatarioNotificacao";
import type {
  CanalNotificacao,
  TipoNotificacao,
} from "../../domain/StatusEnvio";

/**
 * Canal e-mail (spec 011).
 * MVP: mesmo mecanismo do `ConsoleEmailPort` (auth) — log no console.
 * Não usa `EmailPort.enviarConvite` (assinatura só de convite); quando houver
 * provedor real (Resend/SES), extrair adapter compartilhado.
 */
export class EmailNotificacaoCanalAdapter implements NotificacaoCanalPort {
  async despachar(input: {
    canal: CanalNotificacao;
    destinatario: DestinatarioNotificacao;
    tipo: TipoNotificacao;
    conteudo: ConteudoNotificacao;
    notificacaoId: string;
  }): Promise<void> {
    if (input.canal !== "email") {
      throw new Error(
        `EmailNotificacaoCanalAdapter não despacha canal "${input.canal}".`,
      );
    }

    console.info("[NotificacaoCanal:email]", {
      notificacaoId: input.notificacaoId,
      tipo: input.tipo,
      destinatario: input.destinatario,
      titulo: input.conteudo.titulo,
      linkAcao: input.conteudo.linkAcao,
    });
  }
}
