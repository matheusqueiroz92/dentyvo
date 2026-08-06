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
  /** Reflete `ausente_extraido` (acinzentado) — sem cores por face. */
  ausente?: boolean;
  /**
   * `detalhe` — modal (gradiente + legenda).
   * `grade` — odontograma (compacto, fills sólidos compartilhados, sem legenda).
   */
  variante?: "detalhe" | "grade";
};

const ENAMEL = "hsl(var(--odontograma-enamel))";
const ENAMEL_MID = "hsl(var(--odontograma-enamel-mid))";
const ENAMEL_DEEP = "hsl(var(--odontograma-enamel-deep))";
const ROOT = "hsl(var(--odontograma-root))";
const ROOT_DEEP = "hsl(var(--odontograma-root-deep))";
const AUSENTE = "hsl(var(--odontograma-ausente))";
const AUSENTE_SOFT = "hsl(var(--odontograma-ausente-soft))";
const STROKE = "hsl(var(--odontograma-stroke))";

/**
 * Ilustração decorativa (não interativa) do tipo anatômico FDI.
 * Usada no histórico e, em variante compacta, acima de cada dente na grade.
 */
export function IlustracaoTipoDente({
  numeroDente,
  className,
  ausente = false,
  variante = "detalhe",
}: IlustracaoTipoDenteProps) {
  const uid = useId().replace(/:/g, "");
  const tipo = tipoDentePorFdi(numeroDente);
  const rotulo = ROTULOS_TIPO_DENTE[tipo];
  const grade = variante === "grade";

  const enamelFill = ausente
    ? AUSENTE_SOFT
    : grade
      ? ENAMEL_MID
      : `url(#enamel-${uid})`;
  const rootFill = ausente ? AUSENTE : grade ? ROOT : `url(#root-${uid})`;

  return (
    <figure
      className={cn(
        "pointer-events-none flex shrink-0 flex-col items-center",
        grade ? "gap-0" : "gap-1",
        className,
      )}
      data-tipo-dente={tipo}
      data-ausente={ausente ? "true" : "false"}
    >
      <svg
        viewBox="0 0 64 96"
        className={cn(grade ? "h-7 w-5" : "h-16 w-11", ausente && "opacity-70")}
        role="img"
        aria-label={
          ausente
            ? `${rotulo} ausente/extraído (ilustração decorativa do dente ${numeroDente})`
            : `${rotulo} (ilustração decorativa do dente ${numeroDente})`
        }
      >
        {!grade ? (
          <defs>
            <linearGradient
              id={`enamel-${uid}`}
              x1="20%"
              y1="5%"
              x2="80%"
              y2="95%"
            >
              <stop offset="0%" stopColor={ausente ? AUSENTE_SOFT : ENAMEL} />
              <stop
                offset="45%"
                stopColor={ausente ? AUSENTE_SOFT : ENAMEL_MID}
              />
              <stop
                offset="100%"
                stopColor={ausente ? AUSENTE : ENAMEL_DEEP}
              />
            </linearGradient>
            <linearGradient
              id={`root-${uid}`}
              x1="30%"
              y1="0%"
              x2="70%"
              y2="100%"
            >
              <stop offset="0%" stopColor={ausente ? AUSENTE_SOFT : ROOT} />
              <stop
                offset="100%"
                stopColor={ausente ? AUSENTE : ROOT_DEEP}
              />
            </linearGradient>
          </defs>
        ) : null}
        <ToothAnatomy
          tipo={tipo}
          enamel={enamelFill}
          root={rootFill}
          strokeWidth={grade ? 0.9 : 1}
        />
      </svg>
      {!grade ? (
        <figcaption className="text-[10px] font-medium tracking-wide text-muted-foreground">
          {rotulo}
          {ausente ? " · ausente" : null}
        </figcaption>
      ) : null}
    </figure>
  );
}

function ToothAnatomy({
  tipo,
  enamel,
  root,
  strokeWidth,
}: {
  tipo: TipoDenteAnatomico;
  enamel: string;
  root: string;
  strokeWidth: number;
}) {
  switch (tipo) {
    case "incisivo":
      return (
        <g>
          <path
            d="M28 52 Q32 58 32 92 Q32 94 30 94 Q28 94 28 92 Q28 70 26 58 Z"
            fill={root}
            stroke={STROKE}
            strokeWidth={strokeWidth * 0.8}
            opacity={0.9}
          />
          <path
            d="M20 14 Q32 8 44 14 L46 48 Q32 54 18 48 Z"
            fill={enamel}
            stroke={STROKE}
            strokeWidth={strokeWidth}
          />
          <path
            d="M24 18 Q32 14 40 18"
            fill="none"
            stroke={STROKE}
            strokeWidth={strokeWidth * 0.6}
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
            strokeWidth={strokeWidth * 0.8}
            opacity={0.9}
          />
          <path
            d="M22 22 Q32 4 42 22 L45 50 Q32 56 19 50 Z"
            fill={enamel}
            stroke={STROKE}
            strokeWidth={strokeWidth}
          />
          <path
            d="M32 10 L32 40"
            fill="none"
            stroke={STROKE}
            strokeWidth={strokeWidth * 0.55}
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
            strokeWidth={strokeWidth * 0.75}
            opacity={0.88}
          />
          <path
            d="M38 52 Q42 58 41 92 Q40 94 38 93 Q38 70 40 56 Z"
            fill={root}
            stroke={STROKE}
            strokeWidth={strokeWidth * 0.75}
            opacity={0.88}
          />
          <path
            d="M16 20 Q24 10 32 18 Q40 10 48 20 L50 50 Q32 58 14 50 Z"
            fill={enamel}
            stroke={STROKE}
            strokeWidth={strokeWidth}
          />
          <path
            d="M24 18 Q32 26 40 18"
            fill="none"
            stroke={STROKE}
            strokeWidth={strokeWidth * 0.6}
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
            strokeWidth={strokeWidth * 0.7}
            opacity={0.85}
          />
          <path
            d="M31 54 Q33 62 32 94 Q31 95 30 94 Q30 72 30 58 Z"
            fill={root}
            stroke={STROKE}
            strokeWidth={strokeWidth * 0.7}
            opacity={0.85}
          />
          <path
            d="M42 54 Q46 60 45 93 Q44 95 42 94 Q42 72 44 58 Z"
            fill={root}
            stroke={STROKE}
            strokeWidth={strokeWidth * 0.7}
            opacity={0.85}
          />
          <path
            d="M12 18 Q20 8 28 16 Q32 10 36 16 Q44 8 52 18 L54 50 Q32 60 10 50 Z"
            fill={enamel}
            stroke={STROKE}
            strokeWidth={strokeWidth}
          />
          <path
            d="M18 20 Q26 28 32 20 Q38 28 46 20"
            fill="none"
            stroke={STROKE}
            strokeWidth={strokeWidth * 0.55}
            opacity={0.28}
          />
          <path
            d="M22 34 L42 34"
            fill="none"
            stroke={STROKE}
            strokeWidth={strokeWidth * 0.5}
            opacity={0.2}
          />
        </g>
      );
  }
}
