/**
 * Datas civis do atestado na UI: ISO `yyyy-mm-dd` e rótulo pt-BR.
 * Aritmética inclusiva igual ao domínio (`dataInicio + dias - 1`).
 */

export function dataCivilUtcDeIso(iso: string): Date {
  const [ano, mes, dia] = iso.split("-").map(Number);
  return new Date(Date.UTC(ano, (mes ?? 1) - 1, dia ?? 1));
}

export function isoCivilUtc(data: Date): string {
  return data.toISOString().slice(0, 10);
}

export function calcularDataFimIso(
  dataInicioIso: string,
  quantidadeDias: number,
): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dataInicioIso)) return null;
  if (!Number.isInteger(quantidadeDias) || quantidadeDias < 1) return null;
  const inicio = dataCivilUtcDeIso(dataInicioIso);
  const fim = new Date(inicio);
  fim.setUTCDate(fim.getUTCDate() + (quantidadeDias - 1));
  return isoCivilUtc(fim);
}

export function formatarPeriodoAfastamento(
  dataInicio: Date,
  dataFim: Date,
  quantidadeDias: number,
): string {
  const fmt = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "UTC",
  });
  const dias = quantidadeDias === 1 ? "1 dia" : `${quantidadeDias} dias`;
  return `${fmt.format(dataInicio)} a ${fmt.format(dataFim)} — ${dias}`;
}

export function resumirMotivo(motivo: string, max = 80): string {
  const trimmed = motivo.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1)}…`;
}

export function hojeIsoLocal(): string {
  const agora = new Date();
  const y = agora.getFullYear();
  const m = String(agora.getMonth() + 1).padStart(2, "0");
  const d = String(agora.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
