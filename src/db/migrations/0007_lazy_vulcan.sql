CREATE TABLE "vaga_promocional_lancamento" (
	"posicao" smallint PRIMARY KEY NOT NULL,
	"clinica_id" text NOT NULL,
	"assinatura_id" text NOT NULL,
	"reservada_em" timestamp with time zone NOT NULL,
	CONSTRAINT "vaga_promocional_lancamento_posicao_check" CHECK ("vaga_promocional_lancamento"."posicao" >= 1 AND "vaga_promocional_lancamento"."posicao" <= 30)
);
--> statement-breakpoint
ALTER TABLE "assinatura" ADD COLUMN "preco_promocional_centavos" integer;--> statement-breakpoint
ALTER TABLE "assinatura" ADD COLUMN "preco_promocional_ate" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "assinatura" ADD COLUMN "aviso_aumento_preco_enviado_em" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "assinatura" ADD COLUMN "migrada_para_preco_cheio_em" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "vaga_promocional_lancamento" ADD CONSTRAINT "vaga_promocional_lancamento_clinica_id_clinica_id_fk" FOREIGN KEY ("clinica_id") REFERENCES "public"."clinica"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vaga_promocional_lancamento" ADD CONSTRAINT "vaga_promocional_lancamento_assinatura_id_assinatura_id_fk" FOREIGN KEY ("assinatura_id") REFERENCES "public"."assinatura"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "vaga_promocional_lancamento_clinica_id_uidx" ON "vaga_promocional_lancamento" USING btree ("clinica_id");