import type { TipoDocumentoFiscal } from "@/core/auth/domain/DocumentoFiscal";

import { formatarCpfCompleto } from "@/lib/pacientes/cpf";

function apenasDigitos(valor: string): string {
  return valor.replace(/\D/g, "");
}

function formatarCnpjCompleto(cnpjDigitos: string): string {
  const d = apenasDigitos(cnpjDigitos);
  if (d.length !== 14) return cnpjDigitos;
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
}

/** CPF/CNPJ formatado para exibição (somente leitura). */
export function formatarDocumentoFiscal(
  tipo: TipoDocumentoFiscal,
  valor: string,
): string {
  if (tipo === "cpf") {
    return formatarCpfCompleto(valor);
  }
  return formatarCnpjCompleto(valor);
}

export function rotuloTipoDocumento(tipo: TipoDocumentoFiscal): string {
  return tipo === "cpf" ? "CPF" : "CNPJ";
}
