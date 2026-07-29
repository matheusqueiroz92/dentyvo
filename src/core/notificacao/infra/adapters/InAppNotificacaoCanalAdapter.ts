import type { NotificacaoCanalPort } from "../../application/ports/NotificacaoCanalPort";
import type { ConteudoNotificacao } from "../../domain/ConteudoNotificacao";
import type { DestinatarioNotificacao } from "../../domain/DestinatarioNotificacao";
import type {
  CanalNotificacao,
  TipoNotificacao,
} from "../../domain/StatusEnvio";

/**
 * Canal in-app (spec 011).
 * Sem push/WebSocket: a “entrega” é a própria linha persistida, legível via
 * `ListarNotificacoesNaoLidas`. Este adapter é no-op de sucesso.
 */
export class InAppNotificacaoCanalAdapter implements NotificacaoCanalPort {
  async despachar(input: {
    canal: CanalNotificacao;
    destinatario: DestinatarioNotificacao;
    tipo: TipoNotificacao;
    conteudo: ConteudoNotificacao;
    notificacaoId: string;
  }): Promise<void> {
    if (input.canal !== "in_app") {
      throw new Error(
        `InAppNotificacaoCanalAdapter não despacha canal "${input.canal}".`,
      );
    }
    void input.destinatario;
    void input.tipo;
    void input.conteudo;
    void input.notificacaoId;
  }
}
