import { pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

import { clinica } from "./clinica";

export const convite = pgTable(
  "convite",
  {
    id: text("id").primaryKey(),
    clinicaId: text("clinica_id")
      .notNull()
      .references(() => clinica.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    papel: text("papel").notNull(),
    token: text("token").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    aceitoEm: timestamp("aceito_em"),
    convidadoPorUsuarioId: text("convidado_por_usuario_id").notNull(),
  },
  (table) => [uniqueIndex("convite_token_uidx").on(table.token)],
);
