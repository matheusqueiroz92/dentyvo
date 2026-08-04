import { pgTable, text, uniqueIndex } from "drizzle-orm/pg-core";

import { user } from "./auth";
import { clinica } from "./clinica";

export const profissional = pgTable(
  "profissional",
  {
    id: text("id").primaryKey(),
    clinicaId: text("clinica_id")
      .notNull()
      .references(() => clinica.id, { onDelete: "cascade" }),
    usuarioId: text("usuario_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    nome: text("nome").notNull(),
    papel: text("papel").notNull(),
    cro: text("cro"),
    especialidade: text("especialidade"),
    /** Identificador público único por clínica (`/agendar/[slug]/[slug]`). */
    slug: text("slug").notNull(),
  },
  (table) => [
    uniqueIndex("profissional_usuarioId_uidx").on(table.usuarioId),
    uniqueIndex("profissional_clinica_slug_uidx").on(
      table.clinicaId,
      table.slug,
    ),
  ],
);
