import type { MetodoPagamento } from "@/core/assinatura/domain/MetodoPagamento";
import type { StatusAssinatura } from "@/core/assinatura/domain/StatusAssinatura";
import type { StatusCobranca } from "@/core/assinatura/domain/StatusCobranca";

const ROTULOS_STATUS_ASSINATURA: Record<StatusAssinatura, string> = {
  trialing: "Trial",
  ativa: "Ativa",
  inadimplente: "Inadimplente",
  cancelada: "Cancelada",
};

const ROTULOS_STATUS_COBRANCA: Record<StatusCobranca, string> = {
  pendente: "Pendente",
  paga: "Paga",
  vencida: "Vencida",
  estornada: "Estornada",
};

const ROTULOS_METODO: Record<MetodoPagamento, string> = {
  pix: "Pix",
  boleto: "Boleto",
  cartao: "Cartão",
};

export function rotuloStatusAssinatura(status: StatusAssinatura): string {
  return ROTULOS_STATUS_ASSINATURA[status];
}

export function rotuloStatusCobranca(status: StatusCobranca): string {
  return ROTULOS_STATUS_COBRANCA[status];
}

export function rotuloMetodoPagamento(metodo: MetodoPagamento): string {
  return ROTULOS_METODO[metodo];
}
