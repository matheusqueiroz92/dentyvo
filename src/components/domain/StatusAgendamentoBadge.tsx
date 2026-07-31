import {
  CalendarCheck,
  CalendarClock,
  CalendarX,
  CircleCheck,
  UserX,
} from "lucide-react";

import type { StatusAgendamento } from "@/core/agendamento/domain/StatusAgendamento";
import { Badge } from "@/components/ui/badge";

const CONFIG: Record<
  StatusAgendamento,
  {
    label: string;
    variant: "success" | "warning" | "destructive" | "info" | "secondary";
    Icon: typeof CalendarCheck;
  }
> = {
  confirmado: {
    label: "Confirmada",
    variant: "success",
    Icon: CalendarCheck,
  },
  pendente: {
    label: "Aguardando",
    variant: "warning",
    Icon: CalendarClock,
  },
  cancelado: {
    label: "Cancelada",
    variant: "destructive",
    Icon: CalendarX,
  },
  faltou: {
    label: "Faltou",
    variant: "destructive",
    Icon: UserX,
  },
  realizado: {
    label: "Finalizada",
    variant: "secondary",
    Icon: CircleCheck,
  },
};

type StatusAgendamentoBadgeProps = {
  status: StatusAgendamento;
  className?: string;
};

/**
 * Badge clínico de status (DESIGN_SYSTEM §2 — semântica clínica).
 * Cor + ícone + texto — nunca só cor.
 */
export function StatusAgendamentoBadge({
  status,
  className,
}: StatusAgendamentoBadgeProps) {
  const { label, variant, Icon } = CONFIG[status];
  return (
    <Badge variant={variant} className={className}>
      <Icon aria-hidden />
      <span>{label}</span>
    </Badge>
  );
}
