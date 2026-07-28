import { type AnyPgColumn, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

import { clinica } from "./clinica";
import { paciente } from "./paciente";
import { profissional } from "./profissional";

/**
 * Prontuário eletrônico (spec 003).
 * Unicidade paciente+clínica: índice único em (clinica_id, paciente_id).
 */
export const prontuario = pgTable(
  "prontuario",
  {
    id: text("id").primaryKey(),
    clinicaId: text("clinica_id")
      .notNull()
      .references(() => clinica.id, { onDelete: "cascade" }),
    pacienteId: text("paciente_id")
      .notNull()
      .references(() => paciente.id, { onDelete: "restrict" }),
    criadoEm: timestamp("criado_em", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("prontuario_clinica_paciente_uidx").on(
      table.clinicaId,
      table.pacienteId,
    ),
  ],
);

/**
 * Evolução clínica append-only (spec 003).
 *
 * `evolucao_retificada_id` UNIQUE garante no máximo uma retificação por
 * evolução original, inclusive sob concorrência. Valores NULL (registros
 * normais) não colidem — semântica padrão do PostgreSQL (sem NULLS NOT DISTINCT).
 */
export const evolucao = pgTable(
  "evolucao",
  {
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
    tipo: text("tipo").notNull(),
    descricao: text("descricao").notNull(),
    registradoEm: timestamp("registrado_em", {
      withTimezone: true,
      mode: "date",
    }).notNull(),
    /** Id opaco — sem FK para procedimento no MVP (spec 003). */
    procedimentoId: text("procedimento_id"),
    evolucaoRetificadaId: text("evolucao_retificada_id").references(
      (): AnyPgColumn => evolucao.id,
      { onDelete: "restrict" },
    ),
    motivoRetificacao: text("motivo_retificacao"),
  },
  (table) => [
    uniqueIndex("evolucao_retificada_id_uidx").on(table.evolucaoRetificadaId),
  ],
);
