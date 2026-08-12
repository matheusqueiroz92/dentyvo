CREATE TABLE "item_orcamento" (
	"id" text PRIMARY KEY NOT NULL,
	"orcamento_id" text NOT NULL,
	"procedimento_id" text NOT NULL,
	"nome" text NOT NULL,
	"valor" double precision NOT NULL,
	"quantidade" integer NOT NULL,
	"ordem" integer NOT NULL,
	CONSTRAINT "item_orcamento_quantidade_check" CHECK ("item_orcamento"."quantidade" >= 1),
	CONSTRAINT "item_orcamento_valor_check" CHECK ("item_orcamento"."valor" >= 0)
);
--> statement-breakpoint
CREATE TABLE "orcamento" (
	"id" text PRIMARY KEY NOT NULL,
	"clinica_id" text NOT NULL,
	"prontuario_id" text NOT NULL,
	"profissional_id" text NOT NULL,
	"status" text NOT NULL,
	"cabecalho" jsonb NOT NULL,
	"valido_ate" date,
	"emitido_em" timestamp with time zone NOT NULL,
	CONSTRAINT "orcamento_status_check" CHECK ("orcamento"."status" IN ('enviado', 'aceito', 'recusado'))
);
--> statement-breakpoint
ALTER TABLE "item_orcamento" ADD CONSTRAINT "item_orcamento_orcamento_id_orcamento_id_fk" FOREIGN KEY ("orcamento_id") REFERENCES "public"."orcamento"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orcamento" ADD CONSTRAINT "orcamento_clinica_id_clinica_id_fk" FOREIGN KEY ("clinica_id") REFERENCES "public"."clinica"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orcamento" ADD CONSTRAINT "orcamento_prontuario_id_prontuario_id_fk" FOREIGN KEY ("prontuario_id") REFERENCES "public"."prontuario"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orcamento" ADD CONSTRAINT "orcamento_profissional_id_profissional_id_fk" FOREIGN KEY ("profissional_id") REFERENCES "public"."profissional"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "item_orcamento_orcamento_ordem_uidx" ON "item_orcamento" USING btree ("orcamento_id","ordem");