"use client";

import { Ban, CircleAlert, CircleCheck, Clock } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { StatusCobranca } from "@/core/assinatura/domain/StatusCobranca";
import { rotuloStatusCobranca } from "@/lib/configuracoes/rotulos-assinatura";

const CONFIG: Record<
  StatusCobranca,
  {
    variant: "warning" | "success" | "destructive" | "secondary";
    Icon: typeof CircleCheck;
  }
> = {
  pendente: { variant: "warning", Icon: Clock },
  paga: { variant: "success", Icon: CircleCheck },
  vencida: { variant: "destructive", Icon: CircleAlert },
  estornada: { variant: "secondary", Icon: Ban },
};

type StatusCobrancaBadgeProps = {
  status: StatusCobranca;
};

/** Status da cobrança SaaS: cor + ícone + texto (nunca só cor). */
export function StatusCobrancaBadge({ status }: StatusCobrancaBadgeProps) {
  const { variant, Icon } = CONFIG[status];
  return (
    <Badge variant={variant}>
      <Icon aria-hidden />
      <span>{rotuloStatusCobranca(status)}</span>
    </Badge>
  );
}
