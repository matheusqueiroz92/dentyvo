import { DadosInvalidosError } from "@/core/shared/errors";

export const STATUS_COBRANCA = [
  "pendente",
  "paga",
  "vencida",
  "estornada",
] as const;

export type StatusCobranca = (typeof STATUS_COBRANCA)[number];

export function assertStatusCobranca(valor: string): StatusCobranca {
  if (!(STATUS_COBRANCA as readonly string[]).includes(valor)) {
    throw new DadosInvalidosError(`Status de cobrança inválido: ${valor}`);
  }
  return valor as StatusCobranca;
}
