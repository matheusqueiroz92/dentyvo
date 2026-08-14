import { TIMEZONE_PADRAO } from "@/core/agendamento/domain/constants";

const dataFmt = new Intl.DateTimeFormat("pt-BR", {
  timeZone: TIMEZONE_PADRAO,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

export function formatarDataPainel(iso: string): string {
  return dataFmt.format(new Date(iso));
}
