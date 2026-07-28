import {
  DadosInvalidosError,
  TenantMismatchError,
} from "@/core/shared/errors";

import { JanelaDisponibilidadeInvalidaError } from "./errors";

/** 0 = domingo … 6 = sábado (compatível com `Date#getDay` no fuso da clínica). */
export type DiaDaSemana = 0 | 1 | 2 | 3 | 4 | 5 | 6;

const DIAS_VALIDOS = new Set([0, 1, 2, 3, 4, 5, 6]);

/** Horário local `HH:mm` (24h). */
const HORA_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

export type DisponibilidadeProfissionalProps = {
  id: string;
  clinicaId: string;
  profissionalId: string;
  diaDaSemana: DiaDaSemana;
  horaInicio: string;
  horaFim: string;
};

/**
 * Janela semanal recorrente de disponibilidade do profissional (spec 002).
 * Múltiplas janelas no mesmo dia são permitidas (ex. intervalo de almoço).
 */
export class DisponibilidadeProfissional {
  readonly id: string;
  readonly clinicaId: string;
  readonly profissionalId: string;
  readonly diaDaSemana: DiaDaSemana;
  readonly horaInicio: string;
  readonly horaFim: string;

  private constructor(props: DisponibilidadeProfissionalProps) {
    this.id = props.id;
    this.clinicaId = props.clinicaId;
    this.profissionalId = props.profissionalId;
    this.diaDaSemana = props.diaDaSemana;
    this.horaInicio = props.horaInicio;
    this.horaFim = props.horaFim;
  }

  static criar(input: {
    id: string;
    clinicaId: string;
    profissionalId: string;
    diaDaSemana: number;
    horaInicio: string;
    horaFim: string;
  }): DisponibilidadeProfissional {
    if (!DIAS_VALIDOS.has(input.diaDaSemana)) {
      throw new JanelaDisponibilidadeInvalidaError(
        "Dia da semana deve ser 0 (domingo) a 6 (sábado).",
      );
    }
    assertHora(input.horaInicio, "horaInicio");
    assertHora(input.horaFim, "horaFim");
    if (horaParaMinutos(input.horaInicio) >= horaParaMinutos(input.horaFim)) {
      throw new JanelaDisponibilidadeInvalidaError(
        "horaInicio deve ser anterior a horaFim (intervalo half-open).",
      );
    }

    return new DisponibilidadeProfissional({
      id: input.id,
      clinicaId: input.clinicaId,
      profissionalId: input.profissionalId,
      diaDaSemana: input.diaDaSemana as DiaDaSemana,
      horaInicio: input.horaInicio,
      horaFim: input.horaFim,
    });
  }

  static reconstituir(
    props: DisponibilidadeProfissionalProps,
  ): DisponibilidadeProfissional {
    return new DisponibilidadeProfissional(props);
  }

  assertPertenceAClinica(clinicaId: string): void {
    if (this.clinicaId !== clinicaId) {
      throw new TenantMismatchError(clinicaId, this.clinicaId);
    }
  }

  /** Sobreposição half-open entre janelas do mesmo dia. */
  sobrepoeNoMesmoDia(outra: DisponibilidadeProfissional): boolean {
    if (
      this.profissionalId !== outra.profissionalId ||
      this.diaDaSemana !== outra.diaDaSemana
    ) {
      return false;
    }
    const a0 = horaParaMinutos(this.horaInicio);
    const a1 = horaParaMinutos(this.horaFim);
    const b0 = horaParaMinutos(outra.horaInicio);
    const b1 = horaParaMinutos(outra.horaFim);
    return a0 < b1 && b0 < a1;
  }
}

/**
 * Garante que o conjunto de janelas do mesmo profissional não tenha
 * sobreposição no mesmo dia (contíguas OK).
 */
export function assertJanelasSemSobreposicao(
  janelas: readonly DisponibilidadeProfissional[],
): void {
  for (let i = 0; i < janelas.length; i++) {
    for (let j = i + 1; j < janelas.length; j++) {
      if (janelas[i]!.sobrepoeNoMesmoDia(janelas[j]!)) {
        throw new JanelaDisponibilidadeInvalidaError(
          "Janelas de disponibilidade não podem se sobrepor no mesmo dia.",
        );
      }
    }
  }
}

/**
 * Verifica se o intervalo `[inicioMinutosDoDia, fimMinutosDoDia)` cabe
 * inteiro em alguma janela do dia. Minutos devem ser calculados no timezone
 * operacional (`TIMEZONE_PADRAO`) pela application layer.
 */
export function intervaloCabeNaDisponibilidade(
  inicioMinutosDoDia: number,
  fimMinutosDoDia: number,
  janelasDoDia: readonly DisponibilidadeProfissional[],
): boolean {
  if (
    !Number.isInteger(inicioMinutosDoDia) ||
    !Number.isInteger(fimMinutosDoDia) ||
    fimMinutosDoDia <= inicioMinutosDoDia ||
    inicioMinutosDoDia < 0 ||
    fimMinutosDoDia > 24 * 60
  ) {
    return false;
  }
  if (janelasDoDia.length === 0) {
    return false;
  }

  return janelasDoDia.some((j) => {
    const j0 = horaParaMinutos(j.horaInicio);
    const j1 = horaParaMinutos(j.horaFim);
    return inicioMinutosDoDia >= j0 && fimMinutosDoDia <= j1;
  });
}

export function horaParaMinutos(hora: string): number {
  const match = HORA_RE.exec(hora);
  if (!match) {
    throw new DadosInvalidosError(`Horário inválido: ${hora}`);
  }
  return Number(match[1]) * 60 + Number(match[2]);
}

function assertHora(valor: string, campo: string): void {
  if (!HORA_RE.test(valor)) {
    throw new JanelaDisponibilidadeInvalidaError(
      `${campo} deve estar no formato HH:mm.`,
    );
  }
}

/** Slot disponível retornado por `ListarHorariosDisponiveis`. */
export type HorarioDisponivel = {
  inicio: Date;
  fim: Date;
};
