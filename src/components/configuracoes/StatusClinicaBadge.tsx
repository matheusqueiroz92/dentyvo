"use client";

import { Ban, CircleCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { StatusClinica } from "@/core/auth/domain/Clinica";

const CONFIG: Record<
  StatusClinica,
  {
    label: string;
    variant: "success" | "secondary";
    Icon: typeof CircleCheck;
  }
> = {
  ativa: {
    label: "Ativa",
    variant: "success",
    Icon: CircleCheck,
  },
  inativa: {
    label: "Inativa",
    variant: "secondary",
    Icon: Ban,
  },
};

type StatusClinicaBadgeProps = {
  status: StatusClinica;
};

/** Status da clínica: cor + ícone + texto (nunca só cor). */
export function StatusClinicaBadge({ status }: StatusClinicaBadgeProps) {
  const { label, variant, Icon } = CONFIG[status];
  return (
    <Badge variant={variant}>
      <Icon aria-hidden />
      <span>{label}</span>
    </Badge>
  );
}
