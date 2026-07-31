import { TIMEZONE_PADRAO } from "@/core/agendamento/domain/constants";
import {
  instanteNoTimezone,
  partesDataNoTimezone,
} from "@/core/agendamento/application/use-cases/helpers";

/**
 * Intervalo half-open `[inicio, fim)` do dia civil no timezone operacional
 * (America/Sao_Paulo), para `ListarAgendamentosDoPeriodo`.
 */
export function periodoDoDia(
  referencia: Date = new Date(),
  timeZone: string = TIMEZONE_PADRAO,
): { dataInicio: Date; dataFim: Date } {
  const { ano, mes, dia } = partesDataNoTimezone(referencia, timeZone);
  const dataInicio = instanteNoTimezone(ano, mes, dia, 0, timeZone);
  const amanha = new Date(dataInicio.getTime() + 24 * 60 * 60 * 1000);
  const partesAmanha = partesDataNoTimezone(amanha, timeZone);
  const dataFim = instanteNoTimezone(
    partesAmanha.ano,
    partesAmanha.mes,
    partesAmanha.dia,
    0,
    timeZone,
  );
  return { dataInicio, dataFim };
}
