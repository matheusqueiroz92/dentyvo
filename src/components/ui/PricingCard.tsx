import { Check } from "lucide-react";
import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/cn";
import { formatBRL } from "@/lib/design-tokens";

export type PricingCardProps = {
  nome: string;
  descricao: string;
  precoMinMensal: number;
  precoMaxMensal: number;
  precoPromocionalMensal?: number;
  recursos: string[];
  ctaLabel: string;
  ctaHref: string;
  destaque?: boolean;
  badge?: string;
  footerNote?: ReactNode;
};

function formatFaixaMensal(min: number, max: number): string {
  const formatter = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  });
  const minimo = formatter.format(min);
  const maximo = formatter.format(max).replace(/^R\$\s?/, "");
  return `${minimo}–${maximo}`;
}

/**
 * Card de plano para superfícies de marketing (landing / preços).
 * Destaca plano popular, faixa de preço cheio e preço promocional opcional.
 */
export function PricingCard({
  nome,
  descricao,
  precoMinMensal,
  precoMaxMensal,
  precoPromocionalMensal,
  recursos,
  ctaLabel,
  ctaHref,
  destaque = false,
  badge,
  footerNote,
}: PricingCardProps) {
  return (
    <Card
      className={cn(
        "relative flex h-full flex-col shadow-[var(--shadow-sm)]",
        destaque &&
          "border-primary shadow-[var(--shadow-md)] ring-1 ring-primary/20",
      )}
    >
      {(badge || destaque) && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge variant={destaque ? "primary" : "default"}>
            {badge ?? "Destaque"}
          </Badge>
        </div>
      )}

      <CardHeader className={cn(badge || destaque ? "pt-8" : undefined)}>
        <CardTitle>{nome}</CardTitle>
        <CardDescription>{descricao}</CardDescription>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-6">
        <div className="space-y-1">
          {precoPromocionalMensal != null ? (
            <>
              <p className="text-sm text-muted-foreground">
                <span className="numeric line-through">
                  {formatFaixaMensal(precoMinMensal, precoMaxMensal)}
                </span>
                <span className="sr-only"> por mês no preço cheio</span>
              </p>
              <p className="flex items-baseline gap-1">
                <span className="numeric text-3xl font-bold tracking-tight text-foreground">
                  {formatBRL(precoPromocionalMensal).replace(",00", "")}
                </span>
                <span className="text-sm text-muted-foreground">/mês</span>
              </p>
              <p className="text-xs leading-[18px] text-muted-foreground">
                Preço de lançamento por 12 meses
              </p>
            </>
          ) : (
            <>
              <p className="flex flex-wrap items-baseline gap-1">
                <span className="numeric text-3xl font-bold tracking-tight text-foreground">
                  {formatFaixaMensal(precoMinMensal, precoMaxMensal)}
                </span>
                <span className="text-sm text-muted-foreground">/mês</span>
              </p>
              <p className="text-xs leading-[18px] text-muted-foreground">
                Faixa mensal do plano
              </p>
            </>
          )}
        </div>

        <ul className="space-y-3" aria-label={`Recursos do plano ${nome}`}>
          {recursos.map((recurso) => (
            <li key={recurso} className="flex gap-3 text-sm leading-[22px]">
              <Check
                className="mt-0.5 size-[18px] shrink-0 text-success"
                strokeWidth={2}
                aria-hidden
              />
              <span>{recurso}</span>
            </li>
          ))}
        </ul>
      </CardContent>

      <CardFooter className="mt-auto flex-col items-stretch gap-3">
        <ButtonLink
          href={ctaHref}
          variant={destaque ? "primary" : "outline"}
          size="lg"
          className="w-full min-h-11"
        >
          {ctaLabel}
        </ButtonLink>
        {footerNote ? (
          <p className="text-center text-xs leading-[18px] text-muted-foreground">
            {footerNote}
          </p>
        ) : null}
      </CardFooter>
    </Card>
  );
}
