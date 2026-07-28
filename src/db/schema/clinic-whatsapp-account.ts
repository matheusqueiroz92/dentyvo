import { pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

import { clinica } from "./clinica";

/**
 * Conta WhatsApp Cloud API por clínica (spec 008).
 * Uma clínica tem no máximo uma conta (`clinica_id` único).
 */
export const clinicWhatsappAccount = pgTable(
  "clinic_whatsapp_account",
  {
    id: text("id").primaryKey(),
    clinicaId: text("clinica_id")
      .notNull()
      .references(() => clinica.id, { onDelete: "cascade" }),
    wabaId: text("waba_id"),
    phoneNumberId: text("phone_number_id"),
    accessTokenCriptografado: text("access_token_criptografado"),
    status: text("status").notNull(),
    conectadoEm: timestamp("conectado_em", {
      withTimezone: true,
      mode: "date",
    }),
    tokenExpiraEm: timestamp("token_expira_em", {
      withTimezone: true,
      mode: "date",
    }),
  },
  (t) => [
    uniqueIndex("clinic_whatsapp_account_clinica_id_uidx").on(t.clinicaId),
    uniqueIndex("clinic_whatsapp_account_phone_number_id_uidx").on(
      t.phoneNumberId,
    ),
  ],
);
