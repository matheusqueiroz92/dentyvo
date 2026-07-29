import type { ConteudoNotificacao } from "../../domain/ConteudoNotificacao";
import type { DestinatarioNotificacao } from "../../domain/DestinatarioNotificacao";
import type {
  CanalNotificacao,
  TipoNotificacao,
} from "../../domain/StatusEnvio";

/**
 * Despacho pelos canais MVP: e-mail e in-app (spec 011).
 *
 * - **e-mail**: envio externo (adapter Resend/SES/etc.).
 * - **in-app**: no MVP a “entrega” é a própria persistência da notificação
 *   para o painel; o adapter pode ser no-op após o save, ou registrar
 *   métrica — o caso de uso marca `enviada` se não houver falha.
 *
 * A port **não** atualiza `statusEnvio`; o caso de uso interpreta sucesso/
 * exceção e chama `marcarCanalComoEnviado` / `marcarCanalComoFalhou`.
 */
export interface NotificacaoCanalPort {
  despachar(input: {
    canal: CanalNotificacao;
    destinatario: DestinatarioNotificacao;
    tipo: TipoNotificacao;
    conteudo: ConteudoNotificacao;
    notificacaoId: string;
  }): Promise<void>;
}
