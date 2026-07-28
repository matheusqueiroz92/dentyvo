import { integer, jsonb, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

import { clinica } from "./clinica";
import { prontuario } from "./prontuario";
import { profissional } from "./profissional";

/**
 * Snapshots imutáveis de anamnese (spec 003).
 * Unicidade (prontuario_id, versao) evita sobrescrita acidental.
 */
export const anamnese = pgTable(
  "anamnese",
  {
    id: text("id").primaryKey(),
    clinicaId: text("clinica_id")
      .notNull()
      .references(() => clinica.id, { onDelete: "cascade" }),
    prontuarioId: text("prontuario_id")
      .notNull()
      .references(() => prontuario.id, { onDelete: "cascade" }),
    versao: integer("versao").notNull(),
    /** Snapshot das 4 seções — sem PHI em tabelas de auditoria. */
    respostas: jsonb("respostas").notNull(),
    preenchidoEm: timestamp("preenchido_em", {
      withTimezone: true,
      mode: "date",
    }).notNull(),
    preenchidoPorProfissionalId: text("preenchido_por_profissional_id")
      .notNull()
      .references(() => profissional.id, { onDelete: "restrict" }),
  },
  (table) => [
    uniqueIndex("anamnese_prontuario_versao_uidx").on(
      table.prontuarioId,
      table.versao,
    ),
  ],
);
