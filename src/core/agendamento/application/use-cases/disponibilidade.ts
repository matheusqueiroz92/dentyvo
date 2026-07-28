import type { DisponibilidadeProfissional } from "../../domain/DisponibilidadeProfissional";
import { intervaloCabeNaDisponibilidade } from "../../domain/DisponibilidadeProfissional";
import { ForaDaDisponibilidadeError } from "../../domain/errors";
import {
  diaDaSemanaNoTimezone,
  minutosDoDiaNoTimezone,
  partesDataNoTimezone,
} from "./helpers";

export function assertCabeNaDisponibilidade(input: {
  profissionalId: string;
  dataHoraInicio: Date;
  dataHoraFim: Date;
  janelas: readonly DisponibilidadeProfissional[];
}): void {
  const diaInicio = diaDaSemanaNoTimezone(input.dataHoraInicio);
  const inicioMin = minutosDoDiaNoTimezone(input.dataHoraInicio);
  let fimMin = minutosDoDiaNoTimezone(input.dataHoraFim);

  const pInicio = partesDataNoTimezone(input.dataHoraInicio);
  const pFim = partesDataNoTimezone(input.dataHoraFim);
  const mesmoDia =
    pInicio.ano === pFim.ano &&
    pInicio.mes === pFim.mes &&
    pInicio.dia === pFim.dia;

  if (!mesmoDia) {
    if (
      fimMin === 0 &&
      input.dataHoraFim.getTime() > input.dataHoraInicio.getTime()
    ) {
      fimMin = 24 * 60;
    } else {
      throw new ForaDaDisponibilidadeError(
        input.profissionalId,
        input.dataHoraInicio,
        input.dataHoraFim,
      );
    }
  }

  const janelasDoDia = input.janelas.filter((j) => j.diaDaSemana === diaInicio);
  if (!intervaloCabeNaDisponibilidade(inicioMin, fimMin, janelasDoDia)) {
    throw new ForaDaDisponibilidadeError(
      input.profissionalId,
      input.dataHoraInicio,
      input.dataHoraFim,
    );
  }
}
