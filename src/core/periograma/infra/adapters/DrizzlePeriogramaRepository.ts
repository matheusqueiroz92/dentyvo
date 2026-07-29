import { randomUUID } from "node:crypto";

import { and, desc, eq, inArray } from "drizzle-orm";

import type { db as Db } from "@/db";
import {
  periograma as periogramaTable,
  periogramaDente as denteTable,
  periogramaPontoSondagem as pontoTable,
} from "@/db/schema/periograma";

import type { PeriogramaRepositoryPort } from "../../application/ports/PeriogramaRepositoryPort";
import type { ClassificacaoFurcaProps } from "../../domain/ClassificacaoFurca";
import type { DentePeriogramaProps } from "../../domain/DentePeriograma";
import { Periograma, type TipoPeriograma } from "../../domain/Periograma";
import type {
  LadoSondagem,
  PosicaoSondagem,
  PontoSondagemProps,
} from "../../domain/PontoSondagem";

type Database = typeof Db;

/**
 * Persistência Drizzle do periograma (spec 005).
 * Append-only: `salvar` só insere; sem update.
 * Dentes e pontos em tabelas normalizadas (transação atômica).
 *
 * Backlog (revisão 005 / P3): teste de integração contra banco real
 * (round-trip + tx + cascade) ainda não automatizado.
 */
export class DrizzlePeriogramaRepository implements PeriogramaRepositoryPort {
  constructor(private readonly db: Database) {}

  async salvar(periograma: Periograma): Promise<void> {
    await this.db.transaction(async (tx) => {
      await tx.insert(periogramaTable).values({
        id: periograma.id,
        clinicaId: periograma.clinicaId,
        prontuarioId: periograma.prontuarioId,
        profissionalId: periograma.profissionalId,
        tipo: periograma.tipo,
        registradoEm: periograma.registradoEm,
      });

      for (const dente of periograma.dentes) {
        const denteId = randomUUID();
        const furca = dente.classificacaoFurca;

        await tx.insert(denteTable).values({
          id: denteId,
          periogramaId: periograma.id,
          numeroDente: dente.numeroDenteValor,
          mobilidade: dente.mobilidade,
          implante: dente.implante,
          furcaSistema: furca?.sistema ?? null,
          furcaGrau: furca?.grau ?? null,
          nota: dente.nota,
        });

        if (dente.pontos.length === 0) continue;

        await tx.insert(pontoTable).values(
          dente.pontos.map((ponto) => ({
            id: randomUUID(),
            periogramaDenteId: denteId,
            lado: ponto.lado,
            posicao: ponto.posicao,
            margemGengival: ponto.margemGengival,
            profundidadeSondagem: ponto.profundidadeSondagem,
            placa: ponto.placa,
            sangramentoSondagem: ponto.sangramentoSondagem,
          })),
        );
      }
    });
  }

  async buscarPorId(
    clinicaId: string,
    periogramaId: string,
  ): Promise<Periograma | null> {
    const rows = await this.db
      .select()
      .from(periogramaTable)
      .where(
        and(
          eq(periogramaTable.clinicaId, clinicaId),
          eq(periogramaTable.id, periogramaId),
        ),
      )
      .limit(1);

    const row = rows[0];
    if (!row) return null;

    const dentes = await this.carregarDentes([row.id]);
    return toDomain(row, dentes.get(row.id) ?? []);
  }

  async listarPorProntuario(
    clinicaId: string,
    prontuarioId: string,
  ): Promise<Periograma[]> {
    const rows = await this.db
      .select()
      .from(periogramaTable)
      .where(
        and(
          eq(periogramaTable.clinicaId, clinicaId),
          eq(periogramaTable.prontuarioId, prontuarioId),
        ),
      )
      .orderBy(desc(periogramaTable.registradoEm));

    if (rows.length === 0) return [];

    const dentesPorPeriograma = await this.carregarDentes(
      rows.map((r) => r.id),
    );

    return rows.map((row) =>
      toDomain(row, dentesPorPeriograma.get(row.id) ?? []),
    );
  }

  private async carregarDentes(
    periogramaIds: string[],
  ): Promise<Map<string, DentePeriogramaProps[]>> {
    const resultado = new Map<string, DentePeriogramaProps[]>();
    if (periogramaIds.length === 0) return resultado;

    const dentes = await this.db
      .select()
      .from(denteTable)
      .where(inArray(denteTable.periogramaId, periogramaIds));

    if (dentes.length === 0) {
      for (const id of periogramaIds) resultado.set(id, []);
      return resultado;
    }

    const pontos = await this.db
      .select()
      .from(pontoTable)
      .where(
        inArray(
          pontoTable.periogramaDenteId,
          dentes.map((d) => d.id),
        ),
      );

    const pontosPorDente = new Map<string, PontoSondagemProps[]>();
    for (const ponto of pontos) {
      const lista = pontosPorDente.get(ponto.periogramaDenteId) ?? [];
      lista.push({
        lado: ponto.lado as LadoSondagem,
        posicao: ponto.posicao as PosicaoSondagem,
        margemGengival: ponto.margemGengival,
        profundidadeSondagem: ponto.profundidadeSondagem,
        placa: ponto.placa,
        sangramentoSondagem: ponto.sangramentoSondagem,
      });
      pontosPorDente.set(ponto.periogramaDenteId, lista);
    }

    for (const dente of dentes) {
      const lista = resultado.get(dente.periogramaId) ?? [];
      lista.push({
        numeroDente: dente.numeroDente,
        mobilidade: dente.mobilidade,
        implante: dente.implante,
        classificacaoFurca: toFurcaProps(dente.furcaSistema, dente.furcaGrau),
        nota: dente.nota,
        pontos: pontosPorDente.get(dente.id) ?? [],
      });
      resultado.set(dente.periogramaId, lista);
    }

    for (const id of periogramaIds) {
      if (!resultado.has(id)) resultado.set(id, []);
    }

    return resultado;
  }
}

function toFurcaProps(
  sistema: string | null,
  grau: number | null,
): ClassificacaoFurcaProps | null {
  if (sistema == null || grau == null) return null;
  return {
    sistema: sistema as ClassificacaoFurcaProps["sistema"],
    grau,
  };
}

function toDomain(
  row: {
    id: string;
    clinicaId: string;
    prontuarioId: string;
    profissionalId: string;
    tipo: string;
    registradoEm: Date;
  },
  dentes: DentePeriogramaProps[],
): Periograma {
  return Periograma.reconstituir({
    id: row.id,
    clinicaId: row.clinicaId,
    prontuarioId: row.prontuarioId,
    profissionalId: row.profissionalId,
    tipo: row.tipo as TipoPeriograma,
    registradoEm: row.registradoEm,
    dentes,
  });
}
