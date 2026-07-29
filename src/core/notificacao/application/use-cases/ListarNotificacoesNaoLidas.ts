import type { DestinatarioNotificacao } from "../../domain/DestinatarioNotificacao";
import type { Notificacao } from "../../domain/Notificacao";
import type { NotificacaoRepositoryPort } from "../ports/NotificacaoRepositoryPort";

export type ListarNotificacoesNaoLidasInput = {
  /**
   * Destinatário = sessão autenticada (clínica ou plataforma).
   * Delivery mapeia `ContextoSessao` / `ContextoSessaoPlataforma` — nunca
   * aceitar id arbitrário de outro usuário (RBAC: só as próprias).
   */
  destinatarioSessao: DestinatarioNotificacao;
};

/**
 * Lista não lidas do próprio destinatário.
 * Super-admin não vê inbox de usuários de clínica.
 *
 * Assinatura: `ListarNotificacoesNaoLidas(destinatario) → Notificacao[]`
 */
export class ListarNotificacoesNaoLidas {
  constructor(private readonly repo: NotificacaoRepositoryPort) {}

  async executar(
    input: ListarNotificacoesNaoLidasInput,
  ): Promise<Notificacao[]> {
    return this.repo.listarNaoLidas(input.destinatarioSessao);
  }
}
