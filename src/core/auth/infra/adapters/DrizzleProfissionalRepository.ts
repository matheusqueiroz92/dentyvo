import { and, eq } from "drizzle-orm";

import { Slug } from "@/core/shared/Slug";

import type { ProfissionalRepositoryPort } from "../../application/ports/ProfissionalRepositoryPort";
import { assertPapel } from "../../domain/Papel";
import { Profissional } from "../../domain/Profissional";
import type { db as Db } from "@/db";
import { profissional as profissionalTable } from "@/db/schema";

type Database = typeof Db;

export class DrizzleProfissionalRepository implements ProfissionalRepositoryPort {
  constructor(private readonly db: Database) {}

  async salvar(profissional: Profissional): Promise<void> {
    await this.db
      .insert(profissionalTable)
      .values({
        id: profissional.id,
        clinicaId: profissional.clinicaId,
        usuarioId: profissional.usuarioId,
        nome: profissional.nome,
        papel: profissional.papel,
        cro: profissional.cro,
        especialidade: profissional.especialidade,
        slug: profissional.slug,
      })
      .onConflictDoUpdate({
        target: profissionalTable.id,
        set: {
          clinicaId: profissional.clinicaId,
          usuarioId: profissional.usuarioId,
          nome: profissional.nome,
          papel: profissional.papel,
          cro: profissional.cro,
          especialidade: profissional.especialidade,
          slug: profissional.slug,
        },
      });
  }

  async buscarPorId(
    clinicaId: string,
    profissionalId: string,
  ): Promise<Profissional | null> {
    const row = await this.db.query.profissional.findFirst({
      where: and(
        eq(profissionalTable.id, profissionalId),
        eq(profissionalTable.clinicaId, clinicaId),
      ),
    });
    return row ? toDomain(row) : null;
  }

  async buscarPorSlug(
    clinicaId: string,
    slug: string,
  ): Promise<Profissional | null> {
    const normalizado = Slug.criar(slug).valor;
    const row = await this.db.query.profissional.findFirst({
      where: and(
        eq(profissionalTable.clinicaId, clinicaId),
        eq(profissionalTable.slug, normalizado),
      ),
    });
    return row ? toDomain(row) : null;
  }

  async buscarPorUsuarioId(usuarioId: string): Promise<Profissional | null> {
    const row = await this.db.query.profissional.findFirst({
      where: eq(profissionalTable.usuarioId, usuarioId),
    });
    return row ? toDomain(row) : null;
  }

  async listarPorClinica(clinicaId: string): Promise<Profissional[]> {
    const rows = await this.db.query.profissional.findMany({
      where: eq(profissionalTable.clinicaId, clinicaId),
    });
    return rows.map(toDomain);
  }

  async remover(clinicaId: string, profissionalId: string): Promise<void> {
    await this.db
      .delete(profissionalTable)
      .where(
        and(
          eq(profissionalTable.id, profissionalId),
          eq(profissionalTable.clinicaId, clinicaId),
        ),
      );
  }
}

function toDomain(row: {
  id: string;
  clinicaId: string;
  usuarioId: string;
  nome: string;
  papel: string;
  cro: string | null;
  especialidade: string | null;
  slug: string;
}): Profissional {
  return Profissional.reconstituir({
    id: row.id,
    clinicaId: row.clinicaId,
    usuarioId: row.usuarioId,
    nome: row.nome,
    papel: assertPapel(row.papel),
    cro: row.cro,
    especialidade: row.especialidade,
    slug: row.slug,
  });
}
