CREATE TABLE "menu_publico_procedimento" (
	"clinica_id" text PRIMARY KEY NOT NULL,
	"itens" jsonb NOT NULL
);
--> statement-breakpoint
ALTER TABLE "menu_publico_procedimento" ADD CONSTRAINT "menu_publico_procedimento_clinica_id_clinica_id_fk" FOREIGN KEY ("clinica_id") REFERENCES "public"."clinica"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "clinica" ADD COLUMN "slug" text;
--> statement-breakpoint
UPDATE "clinica"
SET "slug" = trim(both '-' from lower(
  regexp_replace(
    translate(
      "nome",
      'áàâãäéèêëíìîïóòôõöúùûüçñÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇÑ',
      'aaaaaeeeeiiiiooooouuuucnAAAAAEEEEIIIIOOOOOUUUUCN'
    ),
    '[^a-zA-Z0-9]+',
    '-',
    'g'
  )
));
--> statement-breakpoint
UPDATE "clinica"
SET "slug" = 'clinica-' || substr("id", 1, 8)
WHERE "slug" IS NULL OR "slug" = '';
--> statement-breakpoint
UPDATE "clinica" AS c
SET "slug" = c."slug" || '-' || substr(c."id", 1, 6)
WHERE EXISTS (
  SELECT 1 FROM "clinica" AS o
  WHERE o."slug" = c."slug" AND o."id" < c."id"
);
--> statement-breakpoint
ALTER TABLE "clinica" ALTER COLUMN "slug" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "clinica" ADD CONSTRAINT "clinica_slug_unique" UNIQUE("slug");
--> statement-breakpoint
ALTER TABLE "profissional" ADD COLUMN "slug" text;
--> statement-breakpoint
UPDATE "profissional"
SET "slug" = trim(both '-' from lower(
  regexp_replace(
    translate(
      "nome",
      'áàâãäéèêëíìîïóòôõöúùûüçñÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇÑ',
      'aaaaaeeeeiiiiooooouuuucnAAAAAEEEEIIIIOOOOOUUUUCN'
    ),
    '[^a-zA-Z0-9]+',
    '-',
    'g'
  )
));
--> statement-breakpoint
UPDATE "profissional"
SET "slug" = 'prof-' || substr("id", 1, 8)
WHERE "slug" IS NULL OR "slug" = '';
--> statement-breakpoint
UPDATE "profissional" AS p
SET "slug" = p."slug" || '-' || substr(p."id", 1, 6)
WHERE EXISTS (
  SELECT 1 FROM "profissional" AS o
  WHERE o."clinica_id" = p."clinica_id"
    AND o."slug" = p."slug"
    AND o."id" < p."id"
);
--> statement-breakpoint
ALTER TABLE "profissional" ALTER COLUMN "slug" SET NOT NULL;
--> statement-breakpoint
CREATE UNIQUE INDEX "profissional_clinica_slug_uidx" ON "profissional" USING btree ("clinica_id","slug");
