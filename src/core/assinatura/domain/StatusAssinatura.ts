import { DadosInvalidosError } from "@/core/shared/errors";

export const STATUS_ASSINATURA = [
  "trialing",
  "ativa",
  "inadimplente",
  "cancelada",
] as const;

export type StatusAssinatura = (typeof STATUS_ASSINATURA)[number];

export function assertStatusAssinatura(valor: string): StatusAssinatura {
  if (!(STATUS_ASSINATURA as readonly string[]).includes(valor)) {
    throw new DadosInvalidosError(`Status de assinatura inválido: ${valor}`);
  }
  return valor as StatusAssinatura;
}
