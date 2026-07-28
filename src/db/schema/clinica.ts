import { pgTable, text } from "drizzle-orm/pg-core";

export const clinica = pgTable("clinica", {
  id: text("id").primaryKey(),
  nome: text("nome").notNull(),
  endereco: text("endereco").notNull(),
  tipoDocumento: text("tipo_documento").notNull(),
  documento: text("documento").notNull().unique(),
  status: text("status").notNull(),
});
