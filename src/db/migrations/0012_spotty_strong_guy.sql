CREATE TABLE "atestado" (
	"id" text PRIMARY KEY NOT NULL,
	"clinica_id" text NOT NULL,
	"prontuario_id" text NOT NULL,
	"profissional_id" text NOT NULL,
	"motivo" text NOT NULL,
	"cid" text,
	"data_inicio" date NOT NULL,
	"quantidade_dias" integer NOT NULL,
	"data_fim" date NOT NULL,
	"cabecalho" jsonb NOT NULL,
	"emitida_em" timestamp with time zone NOT NULL,
	"assinatura_digital_id" text
);
--> statement-breakpoint
ALTER TABLE "atestado" ADD CONSTRAINT "atestado_clinica_id_clinica_id_fk" FOREIGN KEY ("clinica_id") REFERENCES "public"."clinica"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "atestado" ADD CONSTRAINT "atestado_prontuario_id_prontuario_id_fk" FOREIGN KEY ("prontuario_id") REFERENCES "public"."prontuario"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "atestado" ADD CONSTRAINT "atestado_profissional_id_profissional_id_fk" FOREIGN KEY ("profissional_id") REFERENCES "public"."profissional"("id") ON DELETE restrict ON UPDATE no action;