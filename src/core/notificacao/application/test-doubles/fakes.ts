import { FakeAuditoriaLogPort } from "@/core/prontuario/application/test-doubles/fakes";

import { calcularJanelaDedup, JANELA_DEDUP_MS } from "../../domain/constants";
import type { ConteudoNotificacao } from "../../domain/ConteudoNotificacao";
import type { DestinatarioNotificacao } from "../../domain/DestinatarioNotificacao";
import { mesmosDestinatarios } from "../../domain/DestinatarioNotificacao";
import { Notificacao } from "../../domain/Notificacao";
import type {
  CanalNotificacao,
  TipoNotificacao,
} from "../../domain/StatusEnvio";
import type { NotificacaoCanalPort } from "../ports/NotificacaoCanalPort";
import type {
  NotificacaoRepositoryPort,
  ResultadoCriarNotificacao,
} from "../ports/NotificacaoRepositoryPort";

export { FakeAuditoriaLogPort };

/**
 * Fake in-memory com dedup atômico por balde (espelha contrato da port).
 * Test doubles de application — não é adapter de produção.
 */
export class FakeNotificacaoRepository implements NotificacaoRepositoryPort {
  readonly items = new Map<string, Notificacao>();

  async criarSeNaoDuplicada(
    notificacao: Notificacao,
    janelaMs: number = JANELA_DEDUP_MS,
  ): Promise<ResultadoCriarNotificacao> {
    if (notificacao.chaveNegocio != null) {
      const existente = [...this.items.values()].find((n) =>
        n.ehDuplicataDe(notificacao, janelaMs),
      );
      if (existente) {
        return { notificacao: existente, criada: false };
      }
    }
    this.items.set(notificacao.id, notificacao);
    return { notificacao, criada: true };
  }

  async buscarDuplicadaNaJanela(input: {
    tipo: TipoNotificacao;
    destinatario: DestinatarioNotificacao;
    chaveNegocio: string;
    referencia: Date;
    janelaMs?: number;
  }): Promise<Notificacao | null> {
    const janelaMs = input.janelaMs ?? JANELA_DEDUP_MS;
    const bucket = calcularJanelaDedup(input.referencia, janelaMs);
    return (
      [...this.items.values()].find((n) => {
        if (n.tipo !== input.tipo) return false;
        if (n.chaveNegocio !== input.chaveNegocio) return false;
        if (!mesmosDestinatarios(n.destinatario, input.destinatario)) {
          return false;
        }
        return calcularJanelaDedup(n.criadaEm, janelaMs) === bucket;
      }) ?? null
    );
  }

  async salvar(notificacao: Notificacao): Promise<void> {
    this.items.set(notificacao.id, notificacao);
  }

  async buscarPorId(notificacaoId: string): Promise<Notificacao | null> {
    return this.items.get(notificacaoId) ?? null;
  }

  async listarNaoLidas(
    destinatario: DestinatarioNotificacao,
  ): Promise<Notificacao[]> {
    return [...this.items.values()].filter(
      (n) => !n.lida && n.pertenceAoDestinatario(destinatario),
    );
  }
}

export class FakeNotificacaoCanalPort implements NotificacaoCanalPort {
  readonly despachos: Array<{
    canal: CanalNotificacao;
    notificacaoId: string;
  }> = [];

  /** Canais que devem falhar no despacho (simula e-mail down). */
  canaisQueFalham = new Set<CanalNotificacao>();

  async despachar(input: {
    canal: CanalNotificacao;
    destinatario: DestinatarioNotificacao;
    tipo: TipoNotificacao;
    conteudo: ConteudoNotificacao;
    notificacaoId: string;
  }): Promise<void> {
    if (this.canaisQueFalham.has(input.canal)) {
      throw new Error(`Falha simulada no canal ${input.canal}`);
    }
    this.despachos.push({
      canal: input.canal,
      notificacaoId: input.notificacaoId,
    });
  }
}

export function criarNotificacaoFake(input?: {
  id?: string;
  destinatario?: DestinatarioNotificacao;
  tipo?: TipoNotificacao;
  chaveNegocio?: string | null;
  canais?: CanalNotificacao[];
  criadaEm?: Date;
  titulo?: string;
}): Notificacao {
  return Notificacao.criar({
    id: input?.id ?? "notif-1",
    destinatario: input?.destinatario ?? {
      kind: "usuario",
      usuarioId: "user-1",
    },
    tipo: input?.tipo ?? "cobranca_vencida",
    canais: input?.canais ?? ["email", "in_app"],
    conteudo: {
      titulo: input?.titulo ?? "Cobrança vencida",
      cobrancaId: "cob-1",
    },
    chaveNegocio:
      input?.chaveNegocio === undefined ? "cob-1" : input.chaveNegocio,
    criadaEm: input?.criadaEm,
  });
}
