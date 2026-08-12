import { CheckCircle2, CircleDot, XCircle } from "lucide-react";

import type { StatusOrcamento } from "@/core/orcamento/domain/Orcamento";
import { Badge } from "@/components/ui/badge";

const CONFIG: Record<
  StatusOrcamento,
  {
    label: string;
    variant: "info" | "success" | "destructive";
    Icon: typeof CircleDot;
  }
> = {
  enviado: {
    label: "Enviado",
    variant: "info",
    Icon: CircleDot,
  },
  aceito: {
    label: "Aceito",
    variant: "success",
    Icon: CheckCircle2,
  },
  recusado: {
    label: "Recusado",
    variant: "destructive",
    Icon: XCircle,
  },
};

type StatusOrcamentoBadgeProps = {
  status: StatusOrcamento;
  className?: string;
};

/**
 * Badge comercial de status do orçamento (DESIGN_SYSTEM §2).
 * Cor + ícone + texto — nunca só cor.
 */
export function StatusOrcamentoBadge({
  status,
  className,
}: StatusOrcamentoBadgeProps) {
  const { label, variant, Icon } = CONFIG[status];
  return (
    <Badge variant={variant} className={className}>
      <Icon aria-hidden />
      <span>{label}</span>
    </Badge>
  );
}
