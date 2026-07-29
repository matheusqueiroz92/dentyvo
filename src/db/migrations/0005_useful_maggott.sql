CREATE TABLE "assinatura" (
	"id" text PRIMARY KEY NOT NULL,
	"clinica_id" text NOT NULL,
	"plano_id" text,
	"status" text NOT NULL,
	"gateway_cliente_id" text,
	"gateway_assinatura_id" text,
	"data_inicio" timestamp with time zone NOT NULL,
	"data_fim_trial" timestamp with time zone,
	"data_proxima_cobranca" timestamp with time zone,
	"data_cancelada_em" timestamp with time zone,
	"acesso_manual_ate" timestamp with time zone,
	"acesso_manual_motivo" text
);
--> statement-breakpoint
CREATE TABLE "cobranca" (
	"id" text PRIMARY KEY NOT NULL,
	"assinatura_id" text NOT NULL,
	"gateway_cobranca_id" text NOT NULL,
	"valor" double precision NOT NULL,
	"metodo" text NOT NULL,
	"status" text NOT NULL,
	"vencimento" timestamp with time zone NOT NULL,
	"paga_em" timestamp with time zone,
	"vencida_em" timestamp with time zone,
	"link_pagamento" text
);
--> statement-breakpoint
CREATE TABLE "evento_webhook_processado" (
	"evento_id" text PRIMARY KEY NOT NULL,
	"processado_em" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "plano" (
	"id" text PRIMARY KEY NOT NULL,
	"nome" text NOT NULL,
	"valor_mensal" double precision NOT NULL,
	"limites_de_uso" jsonb DEFAULT '{}'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "receita" (
	"id" text PRIMARY KEY NOT NULL,
	"clinica_id" text NOT NULL,
	"prontuario_id" text NOT NULL,
	"profissional_id" text NOT NULL,
	"itens" jsonb NOT NULL,
	"cabecalho" jsonb NOT NULL,
	"emitida_em" timestamp with time zone NOT NULL,
	"assinatura_digital_id" text
);
--> statement-breakpoint
ALTER TABLE "assinatura" ADD CONSTRAINT "assinatura_clinica_id_clinica_id_fk" FOREIGN KEY ("clinica_id") REFERENCES "public"."clinica"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assinatura" ADD CONSTRAINT "assinatura_plano_id_plano_id_fk" FOREIGN KEY ("plano_id") REFERENCES "public"."plano"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cobranca" ADD CONSTRAINT "cobranca_assinatura_id_assinatura_id_fk" FOREIGN KEY ("assinatura_id") REFERENCES "public"."assinatura"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "receita" ADD CONSTRAINT "receita_clinica_id_clinica_id_fk" FOREIGN KEY ("clinica_id") REFERENCES "public"."clinica"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "receita" ADD CONSTRAINT "receita_prontuario_id_prontuario_id_fk" FOREIGN KEY ("prontuario_id") REFERENCES "public"."prontuario"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "receita" ADD CONSTRAINT "receita_profissional_id_profissional_id_fk" FOREIGN KEY ("profissional_id") REFERENCES "public"."profissional"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "assinatura_clinica_id_uidx" ON "assinatura" USING btree ("clinica_id");--> statement-breakpoint
CREATE UNIQUE INDEX "assinatura_gateway_assinatura_id_uidx" ON "assinatura" USING btree ("gateway_assinatura_id");--> statement-breakpoint
CREATE UNIQUE INDEX "cobranca_gateway_cobranca_id_uidx" ON "cobranca" USING btree ("gateway_cobranca_id");