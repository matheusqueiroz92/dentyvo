import { apenasDigitos } from "./cpf";
import type { PacienteDTO } from "./types";

const dataFmt = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

/** Máscara de digitação BR: (00) 00000-0000 / (00) 0000-0000 */
export function mascararTelefoneInput(bruto: string): string {
  const d = apenasDigitos(bruto).slice(0, 11);
  if (d.length === 0) return "";
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) {
    return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  }
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export function formatarTelefoneBr(telefoneDigitos: string): string {
  const d = apenasDigitos(telefoneDigitos);
  if (d.length === 11) {
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  }
  if (d.length === 10) {
    return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  }
  return telefoneDigitos;
}

export function formatarDataNascimento(isoDate: string): string {
  return dataFmt.format(parseDataNascimentoLocal(isoDate));
}

/** Interpreta YYYY-MM-DD como data civil local (evita deslocar o dia). */
export function parseDataNascimentoLocal(isoDate: string): Date {
  const [y, m, d] = isoDate.split("-").map(Number);
  return new Date(y!, m! - 1, d!);
}

/** Serializa Date (tipicamente midnight UTC do driver `date`) para YYYY-MM-DD. */
export function dataNascimentoParaIso(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function calcularIdade(
  dataNascimentoIso: string,
  referencia: Date = new Date(),
): number {
  const nasc = parseDataNascimentoLocal(dataNascimentoIso);
  let idade = referencia.getFullYear() - nasc.getFullYear();
  const mes = referencia.getMonth() - nasc.getMonth();
  if (mes < 0 || (mes === 0 && referencia.getDate() < nasc.getDate())) {
    idade -= 1;
  }
  return Math.max(0, idade);
}

export function pacienteCorrespondeBusca(
  paciente: PacienteDTO,
  busca: string,
): boolean {
  const q = busca.trim().toLowerCase();
  if (!q) return true;
  const qDigitos = apenasDigitos(q);
  if (paciente.nome.toLowerCase().includes(q)) return true;
  if (qDigitos && paciente.cpf.includes(qDigitos)) return true;
  if (qDigitos && paciente.telefone.includes(qDigitos)) return true;
  return false;
}
