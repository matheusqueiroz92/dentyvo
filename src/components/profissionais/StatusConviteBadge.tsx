"use client";

import { Clock, MailWarning } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { StatusConviteEquipe } from "@/lib/profissionais/types";

const CONFIG: Record<
  StatusConviteEquipe,
  {
    label: string;
    variant: "warning" | "secondary";
    Icon: typeof Clock;
  }
> = {
  pendente: {
    label: "Convite pendente",
    variant: "warning",
    Icon: Clock,
  },
  expirado: {
    label: "Convite expirado",
    variant: "secondary",
    Icon: MailWarning,
  },
};

type StatusConviteBadgeProps = {
  status: StatusConviteEquipe;
};

export function StatusConviteBadge({ status }: StatusConviteBadgeProps) {
  const { label, variant, Icon } = CONFIG[status];
  return (
    <Badge variant={variant}>
      <Icon aria-hidden />
      <span>{label}</span>
    </Badge>
  );
}
