import { and, eq, ilike } from "drizzle-orm";

import { Slug } from "@/core/shared/Slug";

import type {
  AtualizarClinicaParcialInput,
  ClinicaRepositoryPort,
  FiltrosListagemClinicas,
} from "../../application/ports/ClinicaRepositoryPort";
import { Clinica, type StatusClinica } from "../../domain/Clinica";
import {
  DocumentoFiscal,
  type TipoDocumentoFiscal,
} from "../../domain/DocumentoFiscal";
import {
  isTemaClinica,
  type TemaClinica,
} from "../../domain/TemaClinica";
import type { db as Db } from "@/db";
import { clinica as clinicaTable } from "@/db/schema";

type Database = typeof Db;

export class DrizzleClinicaRepository implements ClinicaRepositoryPort {
  constructor(private readonly db: Database) {}

  async salvar(clinica: Clinica): Promise<void> {
    await this.db
      .insert(clinicaTable)
      .values({
        id: clinica.id,
        nome: clinica.nome,
        endereco: clinica.endereco,
        tipoDocumento: clinica.documento.tipo,
        documento: clinica.documento.valor,
        status: clinica.status,
        slug: clinica.slug,
        logoUrl: clinica.logoUrl,
        tema: clinica.tema,
      })
      .onConflictDoUpdate({
        target: clinicaTable.id,
        set: {
          nome: clinica.nome,
          endereco: clinica.endereco,
          tipoDocumento: clinica.documento.tipo,
          documento: clinica.documento.valor,
          status: clinica.status,
          slug: clinica.slug,
          logoUrl: clinica.logoUrl,
          tema: clinica.tema,
        },
      });
  }

  async atualizarParcial(
    input: AtualizarClinicaParcialInput,
  ): Promise<Clinica | null> {
    const set: {
      nome?: string;
      endereco?: string;
      logoUrl?: string | null;
      tema?: string | null;
      slug?: string;
    } = {};
    if (input.nome !== undefined) set.nome = input.nome;
    if (input.endereco !== undefined) set.endereco = input.endereco;
    if (input.logoUrl !== undefined) set.logoUrl = input.logoUrl;
    if (input.tema !== undefined) set.tema = input.tema;
    if (input.slug !== undefined) set.slug = input.slug;
    if (Object.keys(set).length === 0) {
      return this.buscarPorId(input.id);
    }

    const [row] = await this.db
      .update(clinicaTable)
      .set(set)
      .where(eq(clinicaTable.id, input.id))
      .returning();

    return row ? toDomain(row) : null;
  }

  async buscarPorId(id: string): Promise<Clinica | null> {
    const row = await this.db.query.clinica.findFirst({
      where: eq(clinicaTable.id, id),
    });
    return row ? toDomain(row) : null;
  }

  async buscarPorDocumento(
    documento: DocumentoFiscal,
  ): Promise<Clinica | null> {
    const row = await this.db.query.clinica.findFirst({
      where: eq(clinicaTable.documento, documento.valor),
    });
    return row ? toDomain(row) : null;
  }

  async buscarPorSlug(slug: string): Promise<Clinica | null> {
    const normalizado = Slug.criar(slug).valor;
    const row = await this.db.query.clinica.findFirst({
      where: eq(clinicaTable.slug, normalizado),
    });
    return row ? toDomain(row) : null;
  }

  async listar(filtros?: FiltrosListagemClinicas): Promise<Clinica[]> {
    const condicoes = [];
    if (filtros?.status) {
      condicoes.push(eq(clinicaTable.status, filtros.status));
    }
    if (filtros?.busca?.trim()) {
      condicoes.push(ilike(clinicaTable.nome, `%${filtros.busca.trim()}%`));
    }

    const rows = await this.db.query.clinica.findMany({
      where: condicoes.length > 0 ? and(...condicoes) : undefined,
    });

    return rows.map(toDomain);
  }
}

function toDomain(row: {
  id: string;
  nome: string;
  endereco: string;
  tipoDocumento: string;
  documento: string;
  status: string;
  slug: string;
  logoUrl: string | null;
  tema: string | null;
}): Clinica {
  return Clinica.reconstituir({
    id: row.id,
    nome: row.nome,
    endereco: row.endereco,
    documento: DocumentoFiscal.criar(
      row.tipoDocumento as TipoDocumentoFiscal,
      row.documento,
    ),
    status: row.status as StatusClinica,
    slug: row.slug,
    logoUrl: row.logoUrl,
    tema: normalizarTemaPersistido(row.tema),
  });
}

function normalizarTemaPersistido(tema: string | null): TemaClinica | null {
  if (tema == null) return null;
  return isTemaClinica(tema) ? tema : null;
}
