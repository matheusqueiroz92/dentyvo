import { jsonb, pgTable, text } from "drizzle-orm/pg-core";

import { clinica } from "./clinica";

/**
 * Menu público curto (2–4 itens) por clínica.
 * `itens`: `[{ rotuloPublico, procedimentoId }, ...]`
 */
export const menuPublicoProcedimento = pgTable("menu_publico_procedimento", {
  clinicaId: text("clinica_id")
    .primaryKey()
    .references(() => clinica.id, { onDelete: "cascade" }),
  itens: jsonb("itens")
    .$type<Array<{ rotuloPublico: string; procedimentoId: string }>>()
    .notNull(),
});
