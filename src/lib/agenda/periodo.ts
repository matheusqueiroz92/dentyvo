import { TIMEZONE_PADRAO } from "@/core/agendamento/domain/constants";
import {
  instanteNoTimezone,
  partesDataNoTimezone,
} from "@/core/agendamento/application/use-cases/helpers";
import { periodoDoDia } from "@/lib/periodo-dia";

/** Slots de 30 min entre 07:00 e 20:00 (timezone operacional). */
export const HORA_INICIO_GRADE = 7;
export const HORA_FIM_GRADE = 20;
export const MINUTOS_POR_SLOT = 30;

export function periodoDaSemana(
  referencia: Date = new Date(),
  timeZone: string = TIMEZONE_PADRAO,
): { dataInicio: Date; dataFim: Date } {
  const { ano, mes, dia } = partesDataNoTimezone(referencia, timeZone);
  const meioDia = instanteNoTimezone(ano, mes, dia, 12 * 60, timeZone);

  const weekdayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  const short = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
  }).format(meioDia);
  const dow = weekdayMap[short] ?? 0;

  const inicioSemana = new Date(meioDia.getTime() - dow * 24 * 60 * 60 * 1000);
  const partesInicio = partesDataNoTimezone(inicioSemana, timeZone);
  const dataInicio = instanteNoTimezone(
    partesInicio.ano,
    partesInicio.mes,
    partesInicio.dia,
    0,
    timeZone,
  );
  const dataFim = new Date(dataInicio.getTime() + 7 * 24 * 60 * 60 * 1000);
  return { dataInicio, dataFim };
}

export function periodoParaModo(
  modo: "dia" | "semana",
  referencia: Date,
): { dataInicio: Date; dataFim: Date } {
  return modo === "semana"
    ? periodoDaSemana(referencia)
    : periodoDoDia(referencia);
}

export function adicionarDias(data: Date, dias: number): Date {
  return new Date(data.getTime() + dias * 24 * 60 * 60 * 1000);
}

/**
 * Formata instante ISO para HH:mm no timezone operacional.
 * Valores inválidos não derrubam a UI: retorna "—" e registra aviso.
 */
export function formatarHora(iso: string): string {
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) {
    console.warn("[formatarHora] valor ISO inválido:", iso);
    return "—";
  }
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TIMEZONE_PADRAO,
    hour12: false,
  }).format(data);
}

export function formatarDataCurta(data: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    timeZone: TIMEZONE_PADRAO,
  }).format(data);
}

export function formatarDataCompleta(data: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: TIMEZONE_PADRAO,
  }).format(data);
}

/** Gera lista de horários HH:mm da grade. */
export function slotsDoDia(): string[] {
  const slots: string[] = [];
  for (let h = HORA_INICIO_GRADE; h < HORA_FIM_GRADE; h++) {
    for (let m = 0; m < 60; m += MINUTOS_POR_SLOT) {
      slots.push(
        `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`,
      );
    }
  }
  return slots;
}

/** Dias civis no intervalo half-open [inicio, fim). */
export function diasNoPeriodo(dataInicio: Date, dataFim: Date): Date[] {
  const dias: Date[] = [];
  let cursor = dataInicio;
  while (cursor < dataFim) {
    dias.push(cursor);
    cursor = adicionarDias(cursor, 1);
  }
  return dias;
}

/**
 * Monta ISO do slot (início) no timezone operacional a partir de um dia
 * civil (Date qualquer no dia) e horário "HH:mm".
 */
export function instanteSlot(dia: Date, horaHm: string): Date {
  const { ano, mes, dia: d } = partesDataNoTimezone(dia, TIMEZONE_PADRAO);
  const [h, m] = horaHm.split(":").map(Number);
  const minutosDoDia = (h ?? 0) * 60 + (m ?? 0);
  return instanteNoTimezone(ano, mes, d, minutosDoDia, TIMEZONE_PADRAO);
}

export function chaveSlot(profissionalId: string, inicioIso: string): string {
  return `${profissionalId}|${inicioIso}`;
}

export function parseChaveSlot(chave: string): {
  profissionalId: string;
  inicioIso: string;
} {
  const sep = chave.indexOf("|");
  return {
    profissionalId: chave.slice(0, sep),
    inicioIso: chave.slice(sep + 1),
  };
}

/** Alinha um instante ao slot de 30 min anterior ou igual. */
export function alinharAoSlot(iso: string): string {
  const d = new Date(iso);
  const partes = partesDataNoTimezone(d, TIMEZONE_PADRAO);
  const horaStr = new Intl.DateTimeFormat("en-GB", {
    timeZone: TIMEZONE_PADRAO,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
  const [hStr, mStr] = horaStr.split(":");
  const h = Number(hStr);
  const m = Number(mStr);
  const mAlinhado = Math.floor(m / MINUTOS_POR_SLOT) * MINUTOS_POR_SLOT;
  return instanteNoTimezone(
    partes.ano,
    partes.mes,
    partes.dia,
    h * 60 + mAlinhado,
    TIMEZONE_PADRAO,
  ).toISOString();
}
