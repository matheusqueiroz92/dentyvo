import { eq } from "drizzle-orm";

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

  /** Spec 009 — implementação completa fica no adapter quando a feature for entregue. */
  async listar(_filtros?: FiltrosListagemClinicas): Promise<Clinica[]> {
    throw new Error(
      "ClinicaRepositoryPort.listar ainda não implementado (spec 009).",
    );
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
