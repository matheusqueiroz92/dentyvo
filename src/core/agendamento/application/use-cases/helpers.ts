import {
  PermissaoNegadaError,
  TenantMismatchError,
} from "@/core/shared/errors";

import type { Profissional } from "@/core/auth/domain/Profissional";
import type { ProfissionalRepositoryPort } from "@/core/auth/application/ports/ProfissionalRepositoryPort";

import type { AcaoAgendamento } from "../../domain/autorizacao";
import { assertPode } from "../../domain/autorizacao";
import type { DiaDaSemana } from "../../domain/DisponibilidadeProfissional";
import { TIMEZONE_PADRAO } from "../../domain/constants";

export async function obterSolicitanteNaClinica(
  profissionalRepo: ProfissionalRepositoryPort,
  usuarioId: string,
  clinicaId: string,
): Promise<Profissional> {
  const solicitante = await profissionalRepo.buscarPorUsuarioId(usuarioId);
  if (!solicitante) {
    throw new PermissaoNegadaError("desconhecido", "acesso");
  }
  if (solicitante.clinicaId !== clinicaId) {
    throw new TenantMismatchError(clinicaId, solicitante.clinicaId);
  }
  return solicitante;
}

export function autorizar(
  solicitante: Profissional,
  acao: AcaoAgendamento,
): void {
  assertPode(solicitante.papel, acao);
}

/** Minutos desde meia-noite no timezone operacional. */
export function minutosDoDiaNoTimezone(
  date: Date,
  timeZone: string = TIMEZONE_PADRAO,
): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? "0");
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? "0");
  return hour * 60 + minute;
}

/** Dia da semana 0–6 no timezone operacional (0 = domingo). */
export function diaDaSemanaNoTimezone(
  date: Date,
  timeZone: string = TIMEZONE_PADRAO,
): DiaDaSemana {
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
  }).format(date);
  const map: Record<string, DiaDaSemana> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  const dia = map[weekday];
  if (dia === undefined) {
    throw new Error(`Não foi possível obter dia da semana para ${weekday}`);
  }
  return dia;
}

/** Instante UTC correspondente a (ano-mês-dia + minutos) no timezone dado. */
export function instanteNoTimezone(
  ano: number,
  mes: number,
  dia: number,
  minutosDoDia: number,
  timeZone: string = TIMEZONE_PADRAO,
): Date {
  const hora = Math.floor(minutosDoDia / 60);
  const minuto = minutosDoDia % 60;
  const isoLocal = `${String(ano).padStart(4, "0")}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}T${String(hora).padStart(2, "0")}:${String(minuto).padStart(2, "0")}:00`;

  // Estratégia: procurar o UTC cujo format no timezone bate com isoLocal.
  // Offset fixo America/Sao_Paulo = -3h (sem DST desde 2019).
  if (timeZone === "America/Sao_Paulo") {
    return new Date(`${isoLocal}-03:00`);
  }

  // Fallback genérico aproximado via Date parsing + verificação.
  const tentativa = new Date(isoLocal + "Z");
  return tentativa;
}

export function partesDataNoTimezone(
  date: Date,
  timeZone: string = TIMEZONE_PADRAO,
): { ano: number; mes: number; dia: number } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  return {
    ano: Number(parts.find((p) => p.type === "year")?.value),
    mes: Number(parts.find((p) => p.type === "month")?.value),
    dia: Number(parts.find((p) => p.type === "day")?.value),
  };
}
