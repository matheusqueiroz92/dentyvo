import { jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";

import { clinica } from "./clinica";

/**
 * Trilha de auditoria de acesso a dado clínico / tenant (spec 003 + 009).
 * `detalhe` só metadados/IDs — nunca texto clínico.
 *
 * Spec 009: `clinicaId` e `atorProfissionalId` nullable quando o ator é
 * `UsuarioPlataforma`; `atorUsuarioPlataformaId` identifica o super-admin.
 */
export const auditoriaLog = pgTable("auditoria_log", {
  id: text("id").primaryKey(),
  clinicaId: text("clinica_id").references(() => clinica.id, {
    onDelete: "cascade",
  }),
  atorUsuarioId: text("ator_usuario_id").notNull(),
  atorProfissionalId: text("ator_profissional_id"),
  atorUsuarioPlataformaId: text("ator_usuario_plataforma_id"),
  acao: text("acao").notNull(),
  recursoTipo: text("recurso_tipo").notNull(),
  recursoId: text("recurso_id").notNull(),
  pacienteId: text("paciente_id"),
  ocorridoEm: timestamp("ocorrido_em", {
    withTimezone: true,
    mode: "date",
  }).notNull(),
  detalhe: jsonb("detalhe"),
});
