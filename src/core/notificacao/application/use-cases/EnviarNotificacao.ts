import type { AuditoriaLogPort } from "@/core/prontuario/application/ports/AuditoriaLogPort";
import { AuditoriaLog } from "@/core/prontuario/domain/AuditoriaLog";

import type { ConteudoNotificacao } from "../../domain/ConteudoNotificacao";
import type { DestinatarioNotificacao } from "../../domain/DestinatarioNotificacao";
import { JANELA_DEDUP_MS } from "../../domain/constants";
import { Notificacao } from "../../domain/Notificacao";
import type {
  CanalNotificacao,
  TipoNotificacao,
} from "../../domain/StatusEnvio";
import type { NotificacaoCanalPort } from "../ports/NotificacaoCanalPort";
import type { NotificacaoRepositoryPort } from "../ports/NotificacaoRepositoryPort";

export type EnviarNotificacaoInput = {
  /** Id gerado na delivery / factory (UUID). */
  id: string;
  destinatario: DestinatarioNotificacao;
  tipo: TipoNotificacao;
  conteudo: ConteudoNotificacao;
  canais: CanalNotificacao[];
  chaveNegocio?: string | null;
  /** Ator para auditoria opcional (falhas / tipos comerciais). */
  atorUsuarioId?: string;
  clinicaId?: string | null;
  atorProfissionalId?: string | null;
  atorUsuarioPlataformaId?: string | null;
  agora?: Date;
};

/**
 * Persiste e despacha notificação pelos canais solicitados.
 * Dedup: mesmo tipo + destinatário + chaveNegocio na janela de 1h →
 * retorna a existente sem reenviar (`criada: false` no repositório).
 *
 * Assinatura: `EnviarNotificacao(destinatario, tipo, conteudo, canais[], chaveNegocio?) → Notificacao`
 */
export class EnviarNotificacao {
  constructor(
    private readonly repo: NotificacaoRepositoryPort,
    private readonly canais: NotificacaoCanalPort,
    private readonly auditoria?: AuditoriaLogPort,
  ) {}

  async executar(input: EnviarNotificacaoInput): Promise<Notificacao> {
    const criadaEm = input.agora ?? new Date();
    const candidata = Notificacao.criar({
      id: input.id,
      destinatario: input.destinatario,
      tipo: input.tipo,
      canais: input.canais,
      conteudo: input.conteudo,
      chaveNegocio: input.chaveNegocio,
      criadaEm,
    });

    const { notificacao: persistida, criada } =
      await this.repo.criarSeNaoDuplicada(candidata, JANELA_DEDUP_MS);

    if (!criada) {
      return persistida;
    }

    let atual = persistida;
    for (const envio of persistida.envios) {
      try {
        await this.canais.despachar({
          canal: envio.canal,
          destinatario: persistida.destinatario,
          tipo: persistida.tipo,
          conteudo: persistida.conteudo,
          notificacaoId: persistida.id,
        });
        atual = atual.marcarCanalComoEnviado(envio.canal);
      } catch {
        atual = atual.marcarCanalComoFalhou(envio.canal);
        await this.registrarFalhaAuditoria(input, atual, envio.canal);
      }
    }

    await this.repo.salvar(atual);
    return atual;
  }

  private async registrarFalhaAuditoria(
    input: EnviarNotificacaoInput,
    notificacao: Notificacao,
    canal: CanalNotificacao,
  ): Promise<void> {
    if (!this.auditoria || !input.atorUsuarioId) return;

    const temProfissional = Boolean(input.atorProfissionalId);
    const temPlataforma = Boolean(input.atorUsuarioPlataformaId);
    if (temProfissional === temPlataforma) {
      console.warn(
        "auditoria de falha de notificação ignorada: ator incompleto",
        { notificacaoId: notificacao.id },
      );
      return;
    }

    await this.auditoria.registrar(
      AuditoriaLog.criar({
        id: `${notificacao.id}:falha:${canal}`,
        clinicaId: input.clinicaId ?? null,
        atorUsuarioId: input.atorUsuarioId,
        atorProfissionalId: input.atorProfissionalId ?? null,
        atorUsuarioPlataformaId: input.atorUsuarioPlataformaId ?? null,
        acao: "escrita",
        recursoTipo: "notificacao",
        recursoId: notificacao.id,
        detalhe: {
          notificacaoId: notificacao.id,
          tipoNotificacao: notificacao.tipo,
          canalNotificacao: canal,
          statusEnvio: "falhou",
        },
      }),
    );
  }
}
