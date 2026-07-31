import { TIMEZONE_PADRAO } from "@/core/agendamento/domain/constants";

const horaFmt = new Intl.DateTimeFormat("pt-BR", {
  timeZone: TIMEZONE_PADRAO,
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

const dataCurtaFmt = new Intl.DateTimeFormat("pt-BR", {
  timeZone: TIMEZONE_PADRAO,
  day: "2-digit",
  month: "short",
});

export function formatarHorario(iso: string): string {
  return horaFmt.format(new Date(iso));
}

export function formatarDataCurta(iso: string): string {
  return dataCurtaFmt.format(new Date(iso));
}

export function diasRestantesAte(ateDataIso: string, agora = new Date()): number {
  const fim = new Date(ateDataIso).getTime();
  const ms = fim - agora.getTime();
  return Math.max(0, Math.ceil(ms / (24 * 60 * 60 * 1000)));
}
