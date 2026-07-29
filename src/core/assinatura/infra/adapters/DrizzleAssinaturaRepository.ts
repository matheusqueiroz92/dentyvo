import { and, eq, gt, isNotNull, isNull, lte } from "drizzle-orm";

import type { db as Db } from "@/db";
import { assinatura as assinaturaTable } from "@/db/schema";

import type { AssinaturaRepositoryPort } from "../../application/ports/AssinaturaRepositoryPort";
import { Assinatura, adicionarDiasCorridos } from "../../domain/Assinatura";
import type { StatusAssinatura } from "../../domain/StatusAssinatura";
import { assertStatusAssinatura } from "../../domain/StatusAssinatura";

type Database = typeof Db;

export class DrizzleAssinaturaRepository implements AssinaturaRepositoryPort {
  constructor(private readonly db: Database) {}

  async salvar(assinatura: Assinatura): Promise<void> {
    await this.db
      .insert(assinaturaTable)
      .values(toRow(assinatura))
      .onConflictDoUpdate({
        target: assinaturaTable.id,
        set: {
          clinicaId: assinatura.clinicaId,
          planoId: assinatura.planoId,
          status: assinatura.status,
          gatewayClienteId: assinatura.gatewayClienteId,
          gatewayAssinaturaId: assinatura.gatewayAssinaturaId,
          dataInicio: assinatura.dataInicio,
          dataFimTrial: assinatura.dataFimTrial,
          dataProximaCobranca: assinatura.dataProximaCobranca,
          dataCanceladaEm: assinatura.dataCanceladaEm,
          acessoManualAte: assinatura.acessoManualAte,
          acessoManualMotivo: assinatura.acessoManualMotivo,
          precoPromocionalCentavos: assinatura.precoPromocionalCentavos,
          precoPromocionalAte: assinatura.precoPromocionalAte,
          avisoAumentoPrecoEnviadoEm: assinatura.avisoAumentoPrecoEnviadoEm,
          migradaParaPrecoCheioEm: assinatura.migradaParaPrecoCheioEm,
        },
      });
  }

  async buscarPorId(id: string): Promise<Assinatura | null> {
    const row = await this.db.query.assinatura.findFirst({
      where: eq(assinaturaTable.id, id),
    });
    return row ? toDomain(row) : null;
  }

  async buscarPorClinicaId(clinicaId: string): Promise<Assinatura | null> {
    const row = await this.db.query.assinatura.findFirst({
      where: eq(assinaturaTable.clinicaId, clinicaId),
    });
    return row ? toDomain(row) : null;
  }

  async buscarPorGatewayAssinaturaId(
    gatewayAssinaturaId: string,
  ): Promise<Assinatura | null> {
    const row = await this.db.query.assinatura.findFirst({
      where: eq(assinaturaTable.gatewayAssinaturaId, gatewayAssinaturaId),
    });
    return row ? toDomain(row) : null;
  }

  async listarComAvisoAumentoPrecoPendente(input: {
    agora: Date;
    antecedenciaDias: number;
    limite?: number;
  }): Promise<Assinatura[]> {
    const limiteAte = adicionarDiasCorridos(
      input.agora,
      input.antecedenciaDias,
    );

    const query = this.db
      .select()
      .from(assinaturaTable)
      .where(
        and(
          isNotNull(assinaturaTable.precoPromocionalCentavos),
          isNotNull(assinaturaTable.precoPromocionalAte),
          isNull(assinaturaTable.avisoAumentoPrecoEnviadoEm),
          gt(assinaturaTable.precoPromocionalAte, input.agora),
          lte(assinaturaTable.precoPromocionalAte, limiteAte),
        ),
      );

    const rows =
      input.limite != null
        ? await query.limit(input.limite)
        : await query;

    return rows.map(toDomain);
  }
}

function toRow(assinatura: Assinatura) {
  return {
    id: assinatura.id,
    clinicaId: assinatura.clinicaId,
    planoId: assinatura.planoId,
    status: assinatura.status,
    gatewayClienteId: assinatura.gatewayClienteId,
    gatewayAssinaturaId: assinatura.gatewayAssinaturaId,
    dataInicio: assinatura.dataInicio,
    dataFimTrial: assinatura.dataFimTrial,
    dataProximaCobranca: assinatura.dataProximaCobranca,
    dataCanceladaEm: assinatura.dataCanceladaEm,
    acessoManualAte: assinatura.acessoManualAte,
    acessoManualMotivo: assinatura.acessoManualMotivo,
    precoPromocionalCentavos: assinatura.precoPromocionalCentavos,
    precoPromocionalAte: assinatura.precoPromocionalAte,
    avisoAumentoPrecoEnviadoEm: assinatura.avisoAumentoPrecoEnviadoEm,
    migradaParaPrecoCheioEm: assinatura.migradaParaPrecoCheioEm,
  };
}

function toDomain(row: {
  id: string;
  clinicaId: string;
  planoId: string | null;
  status: string;
  gatewayClienteId: string | null;
  gatewayAssinaturaId: string | null;
  dataInicio: Date;
  dataFimTrial: Date | null;
  dataProximaCobranca: Date | null;
  dataCanceladaEm: Date | null;
  acessoManualAte: Date | null;
  acessoManualMotivo: string | null;
  precoPromocionalCentavos?: number | null;
  precoPromocionalAte?: Date | null;
  avisoAumentoPrecoEnviadoEm?: Date | null;
  migradaParaPrecoCheioEm?: Date | null;
}): Assinatura {
  const status = assertStatusAssinatura(row.status) as StatusAssinatura;
  return Assinatura.reconstituir({
    id: row.id,
    clinicaId: row.clinicaId,
    planoId: row.planoId,
    status,
    gatewayClienteId: row.gatewayClienteId,
    gatewayAssinaturaId: row.gatewayAssinaturaId,
    dataInicio: row.dataInicio,
    dataFimTrial: row.dataFimTrial,
    dataProximaCobranca: row.dataProximaCobranca,
    dataCanceladaEm: row.dataCanceladaEm,
    acessoManualAte: row.acessoManualAte,
    acessoManualMotivo: row.acessoManualMotivo,
    precoPromocionalCentavos: row.precoPromocionalCentavos ?? null,
    precoPromocionalAte: row.precoPromocionalAte ?? null,
    avisoAumentoPrecoEnviadoEm: row.avisoAumentoPrecoEnviadoEm ?? null,
    migradaParaPrecoCheioEm: row.migradaParaPrecoCheioEm ?? null,
  });
}
