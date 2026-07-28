import { date, pgTable, text } from "drizzle-orm/pg-core";

import { clinica } from "./clinica";

export const paciente = pgTable("paciente", {
  id: text("id").primaryKey(),
  clinicaId: text("clinica_id")
    .notNull()
    .references(() => clinica.id, { onDelete: "cascade" }),
  nome: text("nome").notNull(),
  cpf: text("cpf").notNull(),
  telefone: text("telefone").notNull(),
  dataNascimento: date("data_nascimento", { mode: "date" }).notNull(),
  contatoEmergencia: text("contato_emergencia"),
});
