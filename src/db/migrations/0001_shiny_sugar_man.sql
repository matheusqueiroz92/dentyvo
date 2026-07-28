CREATE TABLE "agendamento" (
	"id" text PRIMARY KEY NOT NULL,
	"clinica_id" text NOT NULL,
	"paciente_id" text NOT NULL,
	"profissional_id" text NOT NULL,
	"procedimento_id" text NOT NULL,
	"data_hora_inicio" timestamp with time zone NOT NULL,
	"data_hora_fim" timestamp with time zone NOT NULL,
	"status" text NOT NULL,
	"origem" text NOT NULL,
	"motivo_cancelamento" text
);
--> statement-breakpoint
CREATE TABLE "disponibilidade_profissional" (
	"id" text PRIMARY KEY NOT NULL,
	"clinica_id" text NOT NULL,
	"profissional_id" text NOT NULL,
	"dia_da_semana" integer NOT NULL,
	"hora_inicio" text NOT NULL,
	"hora_fim" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lembrete_intencao" (
	"id" text PRIMARY KEY NOT NULL,
	"agendamento_id" text NOT NULL,
	"clinica_id" text NOT NULL,
	"paciente_id" text NOT NULL,
	"profissional_id" text NOT NULL,
	"data_hora_consulta" timestamp with time zone NOT NULL,
	"data_hora_envio_previsto" timestamp with time zone NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "procedimento" (
	"id" text PRIMARY KEY NOT NULL,
	"clinica_id" text NOT NULL,
	"nome" text NOT NULL,
	"duracao_padrao_minutos" integer NOT NULL,
	"valor" double precision NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinica" (
	"id" text PRIMARY KEY NOT NULL,
	"nome" text NOT NULL,
	"endereco" text NOT NULL,
	"tipo_documento" text NOT NULL,
	"documento" text NOT NULL,
	"status" text NOT NULL,
	CONSTRAINT "clinica_documento_unique" UNIQUE("documento")
);
--> statement-breakpoint
CREATE TABLE "convite" (
	"id" text PRIMARY KEY NOT NULL,
	"clinica_id" text NOT NULL,
	"email" text NOT NULL,
	"papel" text NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"aceito_em" timestamp,
	"convidado_por_usuario_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "paciente" (
	"id" text PRIMARY KEY NOT NULL,
	"clinica_id" text NOT NULL,
	"nome" text NOT NULL,
	"cpf" text NOT NULL,
	"telefone" text NOT NULL,
	"data_nascimento" date NOT NULL,
	"contato_emergencia" text
);
--> statement-breakpoint
CREATE TABLE "profissional" (
	"id" text PRIMARY KEY NOT NULL,
	"clinica_id" text NOT NULL,
	"usuario_id" text NOT NULL,
	"nome" text NOT NULL,
	"papel" text NOT NULL,
	"cro" text,
	"especialidade" text
);
--> statement-breakpoint
CREATE TABLE "evolucao" (
	"id" text PRIMARY KEY NOT NULL,
	"clinica_id" text NOT NULL,
	"prontuario_id" text NOT NULL,
	"profissional_id" text NOT NULL,
	"tipo" text NOT NULL,
	"descricao" text NOT NULL,
	"registrado_em" timestamp with time zone NOT NULL,
	"procedimento_id" text,
	"evolucao_retificada_id" text,
	"motivo_retificacao" text
);
--> statement-breakpoint
CREATE TABLE "prontuario" (
	"id" text PRIMARY KEY NOT NULL,
	"clinica_id" text NOT NULL,
	"paciente_id" text NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "agendamento" ADD CONSTRAINT "agendamento_clinica_id_clinica_id_fk" FOREIGN KEY ("clinica_id") REFERENCES "public"."clinica"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agendamento" ADD CONSTRAINT "agendamento_paciente_id_paciente_id_fk" FOREIGN KEY ("paciente_id") REFERENCES "public"."paciente"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agendamento" ADD CONSTRAINT "agendamento_profissional_id_profissional_id_fk" FOREIGN KEY ("profissional_id") REFERENCES "public"."profissional"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agendamento" ADD CONSTRAINT "agendamento_procedimento_id_procedimento_id_fk" FOREIGN KEY ("procedimento_id") REFERENCES "public"."procedimento"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "disponibilidade_profissional" ADD CONSTRAINT "disponibilidade_profissional_clinica_id_clinica_id_fk" FOREIGN KEY ("clinica_id") REFERENCES "public"."clinica"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "disponibilidade_profissional" ADD CONSTRAINT "disponibilidade_profissional_profissional_id_profissional_id_fk" FOREIGN KEY ("profissional_id") REFERENCES "public"."profissional"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lembrete_intencao" ADD CONSTRAINT "lembrete_intencao_agendamento_id_agendamento_id_fk" FOREIGN KEY ("agendamento_id") REFERENCES "public"."agendamento"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lembrete_intencao" ADD CONSTRAINT "lembrete_intencao_clinica_id_clinica_id_fk" FOREIGN KEY ("clinica_id") REFERENCES "public"."clinica"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lembrete_intencao" ADD CONSTRAINT "lembrete_intencao_paciente_id_paciente_id_fk" FOREIGN KEY ("paciente_id") REFERENCES "public"."paciente"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lembrete_intencao" ADD CONSTRAINT "lembrete_intencao_profissional_id_profissional_id_fk" FOREIGN KEY ("profissional_id") REFERENCES "public"."profissional"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "procedimento" ADD CONSTRAINT "procedimento_clinica_id_clinica_id_fk" FOREIGN KEY ("clinica_id") REFERENCES "public"."clinica"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "convite" ADD CONSTRAINT "convite_clinica_id_clinica_id_fk" FOREIGN KEY ("clinica_id") REFERENCES "public"."clinica"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "paciente" ADD CONSTRAINT "paciente_clinica_id_clinica_id_fk" FOREIGN KEY ("clinica_id") REFERENCES "public"."clinica"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profissional" ADD CONSTRAINT "profissional_clinica_id_clinica_id_fk" FOREIGN KEY ("clinica_id") REFERENCES "public"."clinica"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profissional" ADD CONSTRAINT "profissional_usuario_id_user_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evolucao" ADD CONSTRAINT "evolucao_clinica_id_clinica_id_fk" FOREIGN KEY ("clinica_id") REFERENCES "public"."clinica"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evolucao" ADD CONSTRAINT "evolucao_prontuario_id_prontuario_id_fk" FOREIGN KEY ("prontuario_id") REFERENCES "public"."prontuario"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evolucao" ADD CONSTRAINT "evolucao_profissional_id_profissional_id_fk" FOREIGN KEY ("profissional_id") REFERENCES "public"."profissional"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evolucao" ADD CONSTRAINT "evolucao_evolucao_retificada_id_evolucao_id_fk" FOREIGN KEY ("evolucao_retificada_id") REFERENCES "public"."evolucao"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prontuario" ADD CONSTRAINT "prontuario_clinica_id_clinica_id_fk" FOREIGN KEY ("clinica_id") REFERENCES "public"."clinica"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prontuario" ADD CONSTRAINT "prontuario_paciente_id_paciente_id_fk" FOREIGN KEY ("paciente_id") REFERENCES "public"."paciente"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "lembrete_intencao_agendamento_uidx" ON "lembrete_intencao" USING btree ("agendamento_id");--> statement-breakpoint
CREATE UNIQUE INDEX "convite_token_uidx" ON "convite" USING btree ("token");--> statement-breakpoint
CREATE UNIQUE INDEX "profissional_usuarioId_uidx" ON "profissional" USING btree ("usuario_id");--> statement-breakpoint
CREATE UNIQUE INDEX "evolucao_retificada_id_uidx" ON "evolucao" USING btree ("evolucao_retificada_id");--> statement-breakpoint
CREATE UNIQUE INDEX "prontuario_clinica_paciente_uidx" ON "prontuario" USING btree ("clinica_id","paciente_id");