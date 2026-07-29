CREATE TABLE "evento_odontograma" (
	"id" text PRIMARY KEY NOT NULL,
	"clinica_id" text NOT NULL,
	"prontuario_id" text NOT NULL,
	"numero_dente" integer NOT NULL,
	"nivel" text NOT NULL,
	"face" text,
	"estado_novo" text NOT NULL,
	"procedimento_id" text,
	"registrado_em" timestamp with time zone NOT NULL,
	"profissional_id" text NOT NULL,
	"sequencia" bigserial NOT NULL
);
--> statement-breakpoint
ALTER TABLE "evento_odontograma" ADD CONSTRAINT "evento_odontograma_clinica_id_clinica_id_fk" FOREIGN KEY ("clinica_id") REFERENCES "public"."clinica"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evento_odontograma" ADD CONSTRAINT "evento_odontograma_prontuario_id_prontuario_id_fk" FOREIGN KEY ("prontuario_id") REFERENCES "public"."prontuario"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evento_odontograma" ADD CONSTRAINT "evento_odontograma_profissional_id_profissional_id_fk" FOREIGN KEY ("profissional_id") REFERENCES "public"."profissional"("id") ON DELETE restrict ON UPDATE no action;