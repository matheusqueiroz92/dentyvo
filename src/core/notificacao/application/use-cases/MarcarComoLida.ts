import type { DestinatarioNotificacao } from "../../domain/DestinatarioNotificacao";
import type { Notificacao } from "../../domain/Notificacao";
import {
  NotificacaoNaoEncontradaError,
  NotificacaoNaoPertenceAoDestinatarioError,
} from "../../domain/errors";
import type { NotificacaoRepositoryPort } from "../ports/NotificacaoRepositoryPort";

export type MarcarComoLidaInput = {
  notificacaoId: string;
  /** Sessão autenticada — deve ser o destinatário da notificação. */
  destinatarioSessao: DestinatarioNotificacao;
  agora?: Date;
};

/**
 * Marca como lida somente se o solicitante for o destinatário.
 *
 * Assinatura: `MarcarComoLida(notificacaoId) → Notificacao`
 */
export class MarcarComoLida {
  constructor(private readonly repo: NotificacaoRepositoryPort) {}

  async executar(input: MarcarComoLidaInput): Promise<Notificacao> {
    const existente = await this.repo.buscarPorId(input.notificacaoId);
    if (!existente) {
      throw new NotificacaoNaoEncontradaError(input.notificacaoId);
    }
    if (!existente.pertenceAoDestinatario(input.destinatarioSessao)) {
      throw new NotificacaoNaoPertenceAoDestinatarioError(input.notificacaoId);
    }

    const atualizada = existente.marcarComoLida(input.agora);
    if (atualizada !== existente) {
      await this.repo.salvar(atualizada);
    }
    return atualizada;
  }
}
