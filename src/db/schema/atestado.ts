import {
  date,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

import { clinica } from "./clinica";
import { profissional } from "./profissional";
import { prontuario } from "./prontuario";

/**
 * Atestados imutáveis com snapshot de cabeçalho (spec 006b).
 * PDF é gerado sob demanda — sem coluna/blob de arquivo.
 */
export const atestado = pgTable("atestado", {
  id: text("id").primaryKey(),
  clinicaId: text("clinica_id")
    .notNull()
    .references(() => clinica.id, { onDelete: "cascade" }),
  prontuarioId: text("prontuario_id")
    .notNull()
    .references(() => prontuario.id, { onDelete: "cascade" }),
  profissionalId: text("profissional_id")
    .notNull()
    .references(() => profissional.id, { onDelete: "restrict" }),
  motivo: text("motivo").notNull(),
  cid: text("cid"),
  dataInicio: date("data_inicio", { mode: "date" }).notNull(),
  quantidadeDias: integer("quantidade_dias").notNull(),
  dataFim: date("data_fim", { mode: "date" }).notNull(),
  /** Snapshot congelado na emissão (clínica, profissional, paciente). */
  cabecalho: jsonb("cabecalho").notNull(),
  emitidaEm: timestamp("emitida_em", {
    withTimezone: true,
    mode: "date",
  }).notNull(),
  /** Nullable — assinatura digital fora do MVP. */
  assinaturaDigitalId: text("assinatura_digital_id"),
});
