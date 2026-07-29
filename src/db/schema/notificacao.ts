import { sql } from "drizzle-orm";
import {
  boolean,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

/**
 * Notificações (spec 011).
 * Dedup atômico: UNIQUE parcial em (tipo, destinos, chave_negocio, janela_dedup)
 * WHERE chave_negocio IS NOT NULL.
 * Destinatário XOR: coluna não usada persiste como '' (sentinela) para a UNIQUE.
 */
export const notificacao = pgTable(
  "notificacao",
  {
    id: text("id").primaryKey(),
    destinatarioUsuarioId: text("destinatario_usuario_id").notNull().default(""),
    destinatarioUsuarioPlataformaId: text("destinatario_usuario_plataforma_id")
      .notNull()
      .default(""),
    tipo: text("tipo").notNull(),
    chaveNegocio: text("chave_negocio"),
    conteudo: jsonb("conteudo").$type<Record<string, unknown>>().notNull(),
    lida: boolean("lida").notNull().default(false),
    lidaEm: timestamp("lida_em", { withTimezone: true, mode: "date" }),
    criadaEm: timestamp("criada_em", {
      withTimezone: true,
      mode: "date",
    }).notNull(),
    janelaDedup: integer("janela_dedup"),
  },
  (t) => [
    uniqueIndex("notificacao_dedup_uidx")
      .on(
        t.tipo,
        t.destinatarioUsuarioId,
        t.destinatarioUsuarioPlataformaId,
        t.chaveNegocio,
        t.janelaDedup,
      )
      .where(sql`${t.chaveNegocio} is not null`),
  ],
);

/**
 * Status de envio por canal — tabela normalizada (não JSON na linha pai).
 */
export const notificacaoEnvio = pgTable(
  "notificacao_envio",
  {
    notificacaoId: text("notificacao_id")
      .notNull()
      .references(() => notificacao.id, { onDelete: "cascade" }),
    canal: text("canal").notNull(),
    statusEnvio: text("status_envio").notNull(),
  },
  (t) => [primaryKey({ columns: [t.notificacaoId, t.canal] })],
);
