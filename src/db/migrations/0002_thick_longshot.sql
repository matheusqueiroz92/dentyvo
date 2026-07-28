CREATE TABLE "anamnese" (
	"id" text PRIMARY KEY NOT NULL,
	"clinica_id" text NOT NULL,
	"prontuario_id" text NOT NULL,
	"versao" integer NOT NULL,
	"respostas" jsonb NOT NULL,
	"preenchido_em" timestamp with time zone NOT NULL,
	"preenchido_por_profissional_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auditoria_log" (
	"id" text PRIMARY KEY NOT NULL,
	"clinica_id" text NOT NULL,
	"ator_usuario_id" text NOT NULL,
	"ator_profissional_id" text NOT NULL,
	"acao" text NOT NULL,
	"recurso_tipo" text NOT NULL,
	"recurso_id" text NOT NULL,
	"paciente_id" text,
	"ocorrido_em" timestamp with time zone NOT NULL,
	"detalhe" jsonb
);
--> statement-breakpoint
ALTER TABLE "anamnese" ADD CONSTRAINT "anamnese_clinica_id_clinica_id_fk" FOREIGN KEY ("clinica_id") REFERENCES "public"."clinica"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "anamnese" ADD CONSTRAINT "anamnese_prontuario_id_prontuario_id_fk" FOREIGN KEY ("prontuario_id") REFERENCES "public"."prontuario"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "anamnese" ADD CONSTRAINT "anamnese_preenchido_por_profissional_id_profissional_id_fk" FOREIGN KEY ("preenchido_por_profissional_id") REFERENCES "public"."profissional"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auditoria_log" ADD CONSTRAINT "auditoria_log_clinica_id_clinica_id_fk" FOREIGN KEY ("clinica_id") REFERENCES "public"."clinica"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "anamnese_prontuario_versao_uidx" ON "anamnese" USING btree ("prontuario_id","versao");