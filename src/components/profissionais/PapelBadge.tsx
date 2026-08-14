import { Shield, Stethoscope, UserRound } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { Papel } from "@/core/auth/domain/Papel";
import { ROTULO_PAPEL } from "@/lib/profissionais/rotulos";

const CONFIG: Record<
  Papel,
  {
    variant: "primary" | "info" | "secondary";
    Icon: typeof Shield;
  }
> = {
  admin: { variant: "primary", Icon: Shield },
  dentista: { variant: "info", Icon: Stethoscope },
  recepcao: { variant: "secondary", Icon: UserRound },
};

type PapelBadgeProps = {
  papel: Papel;
};

/** Papel da equipe: cor + ícone + texto (nunca só cor). */
export function PapelBadge({ papel }: PapelBadgeProps) {
  const { variant, Icon } = CONFIG[papel];
  return (
    <Badge variant={variant}>
      <Icon aria-hidden />
      <span>{ROTULO_PAPEL[papel]}</span>
    </Badge>
  );
}
