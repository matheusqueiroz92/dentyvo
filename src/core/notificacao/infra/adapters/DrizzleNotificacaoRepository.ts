import { and, eq, inArray } from "drizzle-orm";

import type { db as Db } from "@/db";
import {
  notificacao as notificacaoTable,
  notificacaoEnvio as notificacaoEnvioTable,
} from "@/db/schema";

import type {
  NotificacaoRepositoryPort,
  ResultadoCriarNotificacao,
} from "../../application/ports/NotificacaoRepositoryPort";
import { calcularJanelaDedup, JANELA_DEDUP_MS } from "../../domain/constants";
import type { ConteudoNotificacao } from "../../domain/ConteudoNotificacao";
import type { DestinatarioNotificacao } from "../../domain/DestinatarioNotificacao";
import {
  Notificacao,
  type EnvioPorCanal,
} from "../../domain/Notificacao";
import type {
  CanalNotificacao,
  StatusEnvio,
  TipoNotificacao,
} from "../../domain/StatusEnvio";

type Database = typeof Db;

const SENTINELA_DEST = "";

/**
 * Persistência Drizzle de notificações (spec 011).
 * UNIQUE parcial `notificacao_dedup_uidx` → conflito vira `{ criada: false }`.
 */
export class DrizzleNotificacaoRepository implements NotificacaoRepositoryPort {
  constructor(private readonly db: Database) {}

  async criarSeNaoDuplicada(
    notificacao: Notificacao,
    janelaMs: number = JANELA_DEDUP_MS,
  ): Promise<ResultadoCriarNotificacao> {
    void janelaMs;
    try {
      await this.db.transaction(async (tx) => {
        await tx.insert(notificacaoTable).values(toNotificacaoRow(notificacao));
        if (notificacao.envios.length > 0) {
          await tx.insert(notificacaoEnvioTable).values(
            notificacao.envios.map((e) => ({
              notificacaoId: notificacao.id,
              canal: e.canal,
              statusEnvio: e.statusEnvio,
            })),
          );
        }
      });
      return { notificacao, criada: true };
    } catch (error) {
      if (!isDedupUniqueViolation(error)) throw error;

      const existente = await this.buscarDuplicadaNaJanela({
        tipo: notificacao.tipo,
        destinatario: notificacao.destinatario,
        chaveNegocio: notificacao.chaveNegocio!,
        referencia: notificacao.criadaEm,
        janelaMs,
      });
      if (!existente) throw error;
      return { notificacao: existente, criada: false };
    }
  }

  async buscarDuplicadaNaJanela(input: {
    tipo: TipoNotificacao;
    destinatario: DestinatarioNotificacao;
    chaveNegocio: string;
    referencia: Date;
    janelaMs?: number;
  }): Promise<Notificacao | null> {
    const janelaMs = input.janelaMs ?? JANELA_DEDUP_MS;
    const janela = calcularJanelaDedup(input.referencia, janelaMs);
    const dest = destinatarioParaColunas(input.destinatario);

    const rows = await this.db
      .select()
      .from(notificacaoTable)
      .where(
        and(
          eq(notificacaoTable.tipo, input.tipo),
          eq(notificacaoTable.destinatarioUsuarioId, dest.destinatarioUsuarioId),
          eq(
            notificacaoTable.destinatarioUsuarioPlataformaId,
            dest.destinatarioUsuarioPlataformaId,
          ),
          eq(notificacaoTable.chaveNegocio, input.chaveNegocio),
          eq(notificacaoTable.janelaDedup, janela),
        ),
      )
      .limit(1);

    const row = rows[0];
    if (!row) return null;
    return this.carregarComEnvios(row);
  }

  async salvar(notificacao: Notificacao): Promise<void> {
    await this.db.transaction(async (tx) => {
      await tx
        .update(notificacaoTable)
        .set({
          lida: notificacao.lida,
          lidaEm: notificacao.lidaEm,
          conteudo: notificacao.conteudo,
        })
        .where(eq(notificacaoTable.id, notificacao.id));

      for (const envio of notificacao.envios) {
        await tx
          .insert(notificacaoEnvioTable)
          .values({
            notificacaoId: notificacao.id,
            canal: envio.canal,
            statusEnvio: envio.statusEnvio,
          })
          .onConflictDoUpdate({
            target: [
              notificacaoEnvioTable.notificacaoId,
              notificacaoEnvioTable.canal,
            ],
            set: { statusEnvio: envio.statusEnvio },
          });
      }
    });
  }

  async buscarPorId(notificacaoId: string): Promise<Notificacao | null> {
    const rows = await this.db
      .select()
      .from(notificacaoTable)
      .where(eq(notificacaoTable.id, notificacaoId))
      .limit(1);
    const row = rows[0];
    if (!row) return null;
    return this.carregarComEnvios(row);
  }

  async listarNaoLidas(
    destinatario: DestinatarioNotificacao,
  ): Promise<Notificacao[]> {
    const dest = destinatarioParaColunas(destinatario);
    const rows = await this.db
      .select()
      .from(notificacaoTable)
      .where(
        and(
          eq(notificacaoTable.lida, false),
          eq(notificacaoTable.destinatarioUsuarioId, dest.destinatarioUsuarioId),
          eq(
            notificacaoTable.destinatarioUsuarioPlataformaId,
            dest.destinatarioUsuarioPlataformaId,
          ),
        ),
      );

    if (rows.length === 0) return [];

    const ids = rows.map((r) => r.id);
    const envios = await this.db
      .select()
      .from(notificacaoEnvioTable)
      .where(inArray(notificacaoEnvioTable.notificacaoId, ids));

    const porNotificacao = new Map<string, EnvioPorCanal[]>();
    for (const e of envios) {
      const lista = porNotificacao.get(e.notificacaoId) ?? [];
      lista.push({
        canal: e.canal as CanalNotificacao,
        statusEnvio: e.statusEnvio as StatusEnvio,
      });
      porNotificacao.set(e.notificacaoId, lista);
    }

    return rows.map((row) =>
      toDomain(row, porNotificacao.get(row.id) ?? []),
    );
  }

  private async carregarComEnvios(
    row: typeof notificacaoTable.$inferSelect,
  ): Promise<Notificacao> {
    const envios = await this.db
      .select()
      .from(notificacaoEnvioTable)
      .where(eq(notificacaoEnvioTable.notificacaoId, row.id));

    return toDomain(
      row,
      envios.map((e) => ({
        canal: e.canal as CanalNotificacao,
        statusEnvio: e.statusEnvio as StatusEnvio,
      })),
    );
  }
}

function destinatarioParaColunas(destinatario: DestinatarioNotificacao): {
  destinatarioUsuarioId: string;
  destinatarioUsuarioPlataformaId: string;
} {
  if (destinatario.kind === "usuario") {
    return {
      destinatarioUsuarioId: destinatario.usuarioId,
      destinatarioUsuarioPlataformaId: SENTINELA_DEST,
    };
  }
  return {
    destinatarioUsuarioId: SENTINELA_DEST,
    destinatarioUsuarioPlataformaId: destinatario.usuarioPlataformaId,
  };
}

function toNotificacaoRow(n: Notificacao) {
  const dest = destinatarioParaColunas(n.destinatario);
  return {
    id: n.id,
    destinatarioUsuarioId: dest.destinatarioUsuarioId,
    destinatarioUsuarioPlataformaId: dest.destinatarioUsuarioPlataformaId,
    tipo: n.tipo,
    chaveNegocio: n.chaveNegocio,
    conteudo: n.conteudo,
    lida: n.lida,
    lidaEm: n.lidaEm,
    criadaEm: n.criadaEm,
    janelaDedup: n.janelaDedup,
  };
}

function toDomain(
  row: {
    id: string;
    destinatarioUsuarioId: string;
    destinatarioUsuarioPlataformaId: string;
    tipo: string;
    chaveNegocio: string | null;
    conteudo: Record<string, unknown> | ConteudoNotificacao;
    lida: boolean;
    lidaEm: Date | null;
    criadaEm: Date;
    janelaDedup: number | null;
  },
  envios: EnvioPorCanal[],
): Notificacao {
  return Notificacao.reconstituir({
    id: row.id,
    destinatarioUsuarioId:
      row.destinatarioUsuarioId === SENTINELA_DEST
        ? null
        : row.destinatarioUsuarioId,
    destinatarioUsuarioPlataformaId:
      row.destinatarioUsuarioPlataformaId === SENTINELA_DEST
        ? null
        : row.destinatarioUsuarioPlataformaId,
    tipo: row.tipo as TipoNotificacao,
    chaveNegocio: row.chaveNegocio,
    conteudo: row.conteudo as ConteudoNotificacao,
    envios,
    lida: row.lida,
    lidaEm: row.lidaEm,
    criadaEm: row.criadaEm,
    janelaDedup: row.janelaDedup,
  });
}

function isDedupUniqueViolation(error: unknown): boolean {
  for (const candidate of collectErrorChain(error)) {
    if (candidate.code !== "23505") continue;
    const haystack = [
      candidate.constraint,
      candidate.constraint_name,
      candidate.detail,
      candidate.message,
    ]
      .filter((v): v is string => typeof v === "string")
      .join(" ")
      .toLowerCase();

    if (
      haystack.includes("notificacao_dedup_uidx") ||
      haystack.includes("chave_negocio")
    ) {
      return true;
    }
  }
  return false;
}

function collectErrorChain(
  error: unknown,
): Array<{
  code?: unknown;
  constraint?: unknown;
  constraint_name?: unknown;
  detail?: unknown;
  message?: unknown;
  cause?: unknown;
}> {
  const out: Array<{
    code?: unknown;
    constraint?: unknown;
    constraint_name?: unknown;
    detail?: unknown;
    message?: unknown;
    cause?: unknown;
  }> = [];
  let current: unknown = error;
  for (let i = 0; i < 4 && current && typeof current === "object"; i++) {
    out.push(current as (typeof out)[number]);
    current = (current as { cause?: unknown }).cause;
  }
  return out;
}
