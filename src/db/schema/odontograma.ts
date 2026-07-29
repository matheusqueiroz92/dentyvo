import {
  bigserial,
  integer,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

import { clinica } from "./clinica";
import { profissional } from "./profissional";
import { prontuario } from "./prontuario";

/**
 * Eventos append-only do odontograma (spec 004).
 * `sequencia` é bigserial — ordem monotônica de inserção (desempate).
 */
export const eventoOdontograma = pgTable("evento_odontograma", {
  id: text("id").primaryKey(),
  clinicaId: text("clinica_id")
    .notNull()
    .references(() => clinica.id, { onDelete: "cascade" }),
  prontuarioId: text("prontuario_id")
    .notNull()
    .references(() => prontuario.id, { onDelete: "cascade" }),
  numeroDente: integer("numero_dente").notNull(),
  nivel: text("nivel").notNull(),
  /** Null quando `nivel = dente`. */
  face: text("face"),
  estadoNovo: text("estado_novo").notNull(),
  procedimentoId: text("procedimento_id"),
  registradoEm: timestamp("registrado_em", {
    withTimezone: true,
    mode: "date",
  }).notNull(),
  profissionalId: text("profissional_id")
    .notNull()
    .references(() => profissional.id, { onDelete: "restrict" }),
  /** Auto-incremento no banco — não gerado em código. */
  sequencia: bigserial("sequencia", { mode: "number" }).notNull(),
});
