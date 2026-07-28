import { pgTable, text } from "drizzle-orm/pg-core";

/**
 * Usuário cross-tenant da plataforma (super-admin) — spec 009.
 * Sem `clinica_id`: acesso legitimamente fora do RBAC de clínica.
 */
export const usuarioPlataforma = pgTable("usuario_plataforma", {
  id: text("id").primaryKey(),
  nome: text("nome").notNull(),
  email: text("email").notNull().unique(),
  papel: text("papel").notNull(),
});
