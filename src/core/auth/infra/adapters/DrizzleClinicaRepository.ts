import { and, eq, ilike } from "drizzle-orm";

import type {
  ClinicaRepositoryPort,
  FiltrosListagemClinicas,
} from "../../application/ports/ClinicaRepositoryPort";
import { Clinica, type StatusClinica } from "../../domain/Clinica";
import {
  DocumentoFiscal,
  type TipoDocumentoFiscal,
} from "../../domain/DocumentoFiscal";
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
      })
      .onConflictDoUpdate({
        target: clinicaTable.id,
        set: {
          nome: clinica.nome,
          endereco: clinica.endereco,
          tipoDocumento: clinica.documento.tipo,
          documento: clinica.documento.valor,
          status: clinica.status,
        },
      });
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
  });
}
