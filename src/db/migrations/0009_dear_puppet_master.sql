CREATE TABLE "periograma" (
	"id" text PRIMARY KEY NOT NULL,
	"clinica_id" text NOT NULL,
	"prontuario_id" text NOT NULL,
	"profissional_id" text NOT NULL,
	"tipo" text NOT NULL,
	"registrado_em" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "periograma_dente" (
	"id" text PRIMARY KEY NOT NULL,
	"periograma_id" text NOT NULL,
	"numero_dente" integer NOT NULL,
	"mobilidade" integer,
	"implante" boolean,
	"furca_sistema" text,
	"furca_grau" integer,
	"nota" text
);
--> statement-breakpoint
CREATE TABLE "periograma_ponto_sondagem" (
	"id" text PRIMARY KEY NOT NULL,
	"periograma_dente_id" text NOT NULL,
	"lado" text NOT NULL,
	"posicao" text NOT NULL,
	"margem_gengival" integer,
	"profundidade_sondagem" integer,
	"placa" boolean,
	"sangramento_sondagem" boolean
);
--> statement-breakpoint
ALTER TABLE "periograma" ADD CONSTRAINT "periograma_clinica_id_clinica_id_fk" FOREIGN KEY ("clinica_id") REFERENCES "public"."clinica"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "periograma" ADD CONSTRAINT "periograma_prontuario_id_prontuario_id_fk" FOREIGN KEY ("prontuario_id") REFERENCES "public"."prontuario"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "periograma" ADD CONSTRAINT "periograma_profissional_id_profissional_id_fk" FOREIGN KEY ("profissional_id") REFERENCES "public"."profissional"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "periograma_dente" ADD CONSTRAINT "periograma_dente_periograma_id_periograma_id_fk" FOREIGN KEY ("periograma_id") REFERENCES "public"."periograma"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "periograma_ponto_sondagem" ADD CONSTRAINT "periograma_ponto_sondagem_periograma_dente_id_periograma_dente_id_fk" FOREIGN KEY ("periograma_dente_id") REFERENCES "public"."periograma_dente"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "periograma_dente_periograma_numero_uidx" ON "periograma_dente" USING btree ("periograma_id","numero_dente");--> statement-breakpoint
CREATE UNIQUE INDEX "periograma_ponto_dente_lado_posicao_uidx" ON "periograma_ponto_sondagem" USING btree ("periograma_dente_id","lado","posicao");