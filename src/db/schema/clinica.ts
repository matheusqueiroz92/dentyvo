import { pgTable, text } from "drizzle-orm/pg-core";

export const clinica = pgTable("clinica", {
  id: text("id").primaryKey(),
  nome: text("nome").notNull(),
  endereco: text("endereco").notNull(),
  tipoDocumento: text("tipo_documento").notNull(),
  documento: text("documento").notNull().unique(),
  status: text("status").notNull(),
  /** Identificador público único na plataforma (`/agendar/[slug]`). */
  slug: text("slug").notNull().unique(),
  /** URL pública do logo (Vercel Blob); null = sem logo. */
  logoUrl: text("logo_url"),
  /**
   * Tema visual pré-definido.
   * Default `azul-padrao` (padrão atual da UI) para clínicas existentes.
   * Null também é tratado como padrão na UI.
   */
  tema: text("tema").default("azul-padrao"),
});
