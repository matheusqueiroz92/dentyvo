"use client";

import { Ban, CircleAlert, CircleCheck, Timer } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { StatusAssinatura } from "@/core/assinatura/domain/StatusAssinatura";
import { rotuloStatusAssinatura } from "@/lib/configuracoes/rotulos-assinatura";

const CONFIG: Record<
  StatusAssinatura,
  {
    variant: "info" | "success" | "warning" | "secondary";
    Icon: typeof CircleCheck;
  }
> = {
  trialing: { variant: "info", Icon: Timer },
  ativa: { variant: "success", Icon: CircleCheck },
  inadimplente: { variant: "warning", Icon: CircleAlert },
  cancelada: { variant: "secondary", Icon: Ban },
};

type StatusAssinaturaBadgeProps = {
  status: StatusAssinatura;
};

/** Status da assinatura: cor + ícone + texto (nunca só cor). */
export function StatusAssinaturaBadge({ status }: StatusAssinaturaBadgeProps) {
  const { variant, Icon } = CONFIG[status];
  return (
    <Badge variant={variant}>
      <Icon aria-hidden />
      <span>{rotuloStatusAssinatura(status)}</span>
    </Badge>
  );
}
