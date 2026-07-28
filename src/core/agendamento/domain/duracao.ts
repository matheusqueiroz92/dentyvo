import {
  DURACAO_INCREMENTO_MINUTOS,
  DURACAO_MAXIMA_MINUTOS,
  DURACAO_MINIMA_MINUTOS,
} from "./constants";
import { DuracaoInvalidaError } from "./errors";

/**
 * Valida duração de agendamento/procedimento (spec 002):
 * 15–240 min, múltiplos de 15.
 */
export function assertDuracaoValida(duracaoMinutos: number): void {
  if (
    !Number.isInteger(duracaoMinutos) ||
    duracaoMinutos < DURACAO_MINIMA_MINUTOS ||
    duracaoMinutos > DURACAO_MAXIMA_MINUTOS ||
    duracaoMinutos % DURACAO_INCREMENTO_MINUTOS !== 0
  ) {
    throw new DuracaoInvalidaError(duracaoMinutos);
  }
}

export function calcularDataHoraFim(
  dataHoraInicio: Date,
  duracaoMinutos: number,
): Date {
  assertDuracaoValida(duracaoMinutos);
  return new Date(dataHoraInicio.getTime() + duracaoMinutos * 60_000);
}
