import { DadosInvalidosError } from "@/core/shared/errors";

import { PeriodoAfastamentoInvalidoError } from "./errors";

export type PeriodoAfastamentoProps = {
  dataInicio: Date;
  quantidadeDias: number;
  dataFim: Date;
};

/**
 * Período de afastamento em **data civil UTC** (sem hora) — spec 006b.
 * `dataFim` inclusiva = `dataInicio + (quantidadeDias − 1)`.
 * 1 dia ⇒ início = fim.
 *
 * Delivery deve enviar `dataInicio` como data civil (UTC midnight
 * `yyyy-mm-ddT00:00:00.000Z` ou equivalente); o domínio descarta a hora
 * usando componentes UTC.
 */
export class PeriodoAfastamento {
  readonly dataInicio: Date;
  readonly quantidadeDias: number;
  readonly dataFim: Date;

  private constructor(props: PeriodoAfastamentoProps) {
    this.dataInicio = props.dataInicio;
    this.quantidadeDias = props.quantidadeDias;
    this.dataFim = props.dataFim;
  }

  static criar(dataInicio: Date, quantidadeDias: number): PeriodoAfastamento {
    if (!(dataInicio instanceof Date) || Number.isNaN(dataInicio.getTime())) {
      throw new DadosInvalidosError("dataInicio inválida.");
    }
    if (!Number.isInteger(quantidadeDias) || quantidadeDias < 1) {
      throw new PeriodoAfastamentoInvalidoError(
        "quantidadeDias deve ser um inteiro maior ou igual a 1.",
      );
    }

    const inicio = paraDataCivilUtc(dataInicio);
    const fim = somarDiasCivisUtc(inicio, quantidadeDias - 1);

    return new PeriodoAfastamento({
      dataInicio: inicio,
      quantidadeDias,
      dataFim: fim,
    });
  }

  static reconstituir(props: PeriodoAfastamentoProps): PeriodoAfastamento {
    return new PeriodoAfastamento(props);
  }
}

export function paraDataCivilUtc(data: Date): Date {
  return new Date(
    Date.UTC(data.getUTCFullYear(), data.getUTCMonth(), data.getUTCDate()),
  );
}

export function somarDiasCivisUtc(dataCivil: Date, dias: number): Date {
  return new Date(
    Date.UTC(
      dataCivil.getUTCFullYear(),
      dataCivil.getUTCMonth(),
      dataCivil.getUTCDate() + dias,
    ),
  );
}
