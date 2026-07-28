CREATE TABLE "usuario_plataforma" (
	"id" text PRIMARY KEY NOT NULL,
	"nome" text NOT NULL,
	"email" text NOT NULL,
	"papel" text NOT NULL,
	CONSTRAINT "usuario_plataforma_email_unique" UNIQUE("email")
);
