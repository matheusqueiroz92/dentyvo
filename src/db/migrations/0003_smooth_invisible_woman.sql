CREATE TABLE "clinic_whatsapp_account" (
	"id" text PRIMARY KEY NOT NULL,
	"clinica_id" text NOT NULL,
	"waba_id" text,
	"phone_number_id" text,
	"access_token_criptografado" text,
	"status" text NOT NULL,
	"conectado_em" timestamp with time zone,
	"token_expira_em" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "auditoria_log" ALTER COLUMN "clinica_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "auditoria_log" ALTER COLUMN "ator_profissional_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "auditoria_log" ADD COLUMN "ator_usuario_plataforma_id" text;--> statement-breakpoint
ALTER TABLE "clinic_whatsapp_account" ADD CONSTRAINT "clinic_whatsapp_account_clinica_id_clinica_id_fk" FOREIGN KEY ("clinica_id") REFERENCES "public"."clinica"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "clinic_whatsapp_account_clinica_id_uidx" ON "clinic_whatsapp_account" USING btree ("clinica_id");--> statement-breakpoint
CREATE UNIQUE INDEX "clinic_whatsapp_account_phone_number_id_uidx" ON "clinic_whatsapp_account" USING btree ("phone_number_id");