CREATE TABLE "notificacao" (
	"id" text PRIMARY KEY NOT NULL,
	"destinatario_usuario_id" text DEFAULT '' NOT NULL,
	"destinatario_usuario_plataforma_id" text DEFAULT '' NOT NULL,
	"tipo" text NOT NULL,
	"chave_negocio" text,
	"conteudo" jsonb NOT NULL,
	"lida" boolean DEFAULT false NOT NULL,
	"lida_em" timestamp with time zone,
	"criada_em" timestamp with time zone NOT NULL,
	"janela_dedup" integer
);
--> statement-breakpoint
CREATE TABLE "notificacao_envio" (
	"notificacao_id" text NOT NULL,
	"canal" text NOT NULL,
	"status_envio" text NOT NULL,
	CONSTRAINT "notificacao_envio_notificacao_id_canal_pk" PRIMARY KEY("notificacao_id","canal")
);
--> statement-breakpoint
ALTER TABLE "notificacao_envio" ADD CONSTRAINT "notificacao_envio_notificacao_id_notificacao_id_fk" FOREIGN KEY ("notificacao_id") REFERENCES "public"."notificacao"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "notificacao_dedup_uidx" ON "notificacao" USING btree ("tipo","destinatario_usuario_id","destinatario_usuario_plataforma_id","chave_negocio","janela_dedup") WHERE "notificacao"."chave_negocio" is not null;