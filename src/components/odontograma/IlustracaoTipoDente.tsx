"use client";

import { useId } from "react";

import {
  ROTULOS_TIPO_DENTE,
  tipoDentePorFdi,
  type TipoDenteAnatomico,
} from "@/lib/odontograma/estados";
import { cn } from "@/lib/utils";

type IlustracaoTipoDenteProps = {
  numeroDente: number;
  className?: string;
};

const ENAMEL = "hsl(var(--odontograma-enamel))";
const ENAMEL_MID = "hsl(var(--odontograma-enamel-mid))";
const ENAMEL_DEEP = "hsl(var(--odontograma-enamel-deep))";
const ROOT = "hsl(var(--odontograma-root))";
const ROOT_DEEP = "hsl(var(--odontograma-root-deep))";
const STROKE = "hsl(var(--odontograma-stroke))";

/**
 * Ilustração decorativa (não interativa) do tipo anatômico FDI.
 * Complementa o odontograma esquemático no cabeçalho do histórico.
 */
export function IlustracaoTipoDente({
  numeroDente,
  className,
}: IlustracaoTipoDenteProps) {
  const uid = useId().replace(/:/g, "");
  const tipo = tipoDentePorFdi(numeroDente);
  const rotulo = ROTULOS_TIPO_DENTE[tipo];
  const enamelId = `enamel-${uid}`;
  const rootId = `root-${uid}`;

  return (
    <figure
      className={cn(
        "pointer-events-none flex shrink-0 flex-col items-center gap-1",
        className,
      )}
    >
      <svg
        viewBox="0 0 64 96"
        className="h-16 w-11"
        role="img"
        aria-label={`${rotulo} (ilustração decorativa do dente ${numeroDente})`}
      >
        <defs>
          <linearGradient id={enamelId} x1="20%" y1="5%" x2="80%" y2="95%">
            <stop offset="0%" stopColor={ENAMEL} />
            <stop offset="45%" stopColor={ENAMEL_MID} />
            <stop offset="100%" stopColor={ENAMEL_DEEP} />
          </linearGradient>
          <linearGradient id={rootId} x1="30%" y1="0%" x2="70%" y2="100%">
            <stop offset="0%" stopColor={ROOT} />
            <stop offset="100%" stopColor={ROOT_DEEP} />
          </linearGradient>
        </defs>
        <ToothAnatomy tipo={tipo} enamelId={enamelId} rootId={rootId} />
      </svg>
      <figcaption className="text-[10px] font-medium tracking-wide text-muted-foreground">
        {rotulo}
      </figcaption>
    </figure>
  );
}

function ToothAnatomy({
  tipo,
  enamelId,
  rootId,
}: {
  tipo: TipoDenteAnatomico;
  enamelId: string;
  rootId: string;
}) {
  const enamel = `url(#${enamelId})`;
  const root = `url(#${rootId})`;

  switch (tipo) {
    case "incisivo":
      return (
        <g>
          <path
            d="M28 52 Q32 58 32 92 Q32 94 30 94 Q28 94 28 92 Q28 70 26 58 Z"
            fill={root}
            stroke={STROKE}
            strokeWidth={0.8}
            opacity={0.9}
          />
          <path
            d="M20 14 Q32 8 44 14 L46 48 Q32 54 18 48 Z"
            fill={enamel}
            stroke={STROKE}
            strokeWidth={1}
          />
          <path
            d="M24 18 Q32 14 40 18"
            fill="none"
            stroke={STROKE}
            strokeWidth={0.6}
            opacity={0.25}
          />
        </g>
      );
    case "canino":
      return (
        <g>
          <path
            d="M29 50 Q32 56 32 94 Q30 95 29 94 Q28 70 27 56 Z"
            fill={root}
            stroke={STROKE}
            strokeWidth={0.8}
            opacity={0.9}
          />
          <path
            d="M22 22 Q32 4 42 22 L45 50 Q32 56 19 50 Z"
            fill={enamel}
            stroke={STROKE}
            strokeWidth={1}
          />
          <path
            d="M32 10 L32 40"
            fill="none"
            stroke={STROKE}
            strokeWidth={0.55}
            opacity={0.2}
          />
        </g>
      );
    case "pre_molar":
      return (
        <g>
          <path
            d="M24 52 Q28 58 27 92 Q26 94 24 93 Q24 70 22 56 Z"
            fill={root}
            stroke={STROKE}
            strokeWidth={0.75}
            opacity={0.88}
          />
          <path
            d="M38 52 Q42 58 41 92 Q40 94 38 93 Q38 70 40 56 Z"
            fill={root}
            stroke={STROKE}
            strokeWidth={0.75}
            opacity={0.88}
          />
          <path
            d="M16 20 Q24 10 32 18 Q40 10 48 20 L50 50 Q32 58 14 50 Z"
            fill={enamel}
            stroke={STROKE}
            strokeWidth={1}
          />
          <path
            d="M24 18 Q32 26 40 18"
            fill="none"
            stroke={STROKE}
            strokeWidth={0.6}
            opacity={0.28}
          />
        </g>
      );
    case "molar":
      return (
        <g>
          <path
            d="M20 54 Q24 60 22 93 Q21 95 19 94 Q19 72 18 58 Z"
            fill={root}
            stroke={STROKE}
            strokeWidth={0.7}
            opacity={0.85}
          />
          <path
            d="M31 54 Q33 62 32 94 Q31 95 30 94 Q30 72 30 58 Z"
            fill={root}
            stroke={STROKE}
            strokeWidth={0.7}
            opacity={0.85}
          />
          <path
            d="M42 54 Q46 60 45 93 Q44 95 42 94 Q42 72 44 58 Z"
            fill={root}
            stroke={STROKE}
            strokeWidth={0.7}
            opacity={0.85}
          />
          <path
            d="M12 18 Q20 8 28 16 Q32 10 36 16 Q44 8 52 18 L54 50 Q32 60 10 50 Z"
            fill={enamel}
            stroke={STROKE}
            strokeWidth={1}
          />
          <path
            d="M18 20 Q26 28 32 20 Q38 28 46 20"
            fill="none"
            stroke={STROKE}
            strokeWidth={0.55}
            opacity={0.28}
          />
          <path
            d="M22 34 L42 34"
            fill="none"
            stroke={STROKE}
            strokeWidth={0.5}
            opacity={0.2}
          />
        </g>
      );
  }
}
