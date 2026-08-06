"use client";

import Image from "next/image";

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
   * `detalhe` — modal (maior + legenda).
   * `grade` — odontograma (compacto, sem legenda).
   */
  variante?: "detalhe" | "grade";
};

/** Assets estáticos em `public/ilustracoes-dente/` (MIT — ver ATTRIBUTION.md). */
const SRC_POR_TIPO: Record<TipoDenteAnatomico, string> = {
  incisivo: "/ilustracoes-dente/incisivo.svg",
  canino: "/ilustracoes-dente/canino.svg",
  pre_molar: "/ilustracoes-dente/pre_molar.svg",
  molar: "/ilustracoes-dente/molar.svg",
};

/**
 * Ilustração decorativa (não interativa) do tipo anatômico FDI.
 * Imagens estáticas; estado ausente via CSS (grayscale + opacity).
 */
export function IlustracaoTipoDente({
  numeroDente,
  className,
  ausente = false,
  variante = "detalhe",
}: IlustracaoTipoDenteProps) {
  const tipo = tipoDentePorFdi(numeroDente);
  const rotulo = ROTULOS_TIPO_DENTE[tipo];
  const grade = variante === "grade";
  const src = SRC_POR_TIPO[tipo];

  const tamanho = grade
    ? { width: 20, height: 36, className: "h-7 w-5" }
    : { width: 44, height: 78, className: "h-16 w-11" };

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
      <Image
        src={src}
        alt={
          ausente
            ? `${rotulo} ausente/extraído (ilustração decorativa do dente ${numeroDente})`
            : `${rotulo} (ilustração decorativa do dente ${numeroDente})`
        }
        width={tamanho.width}
        height={tamanho.height}
        unoptimized
        className={cn(
          "object-contain object-bottom select-none",
          tamanho.className,
          ausente && "opacity-50 grayscale",
        )}
        draggable={false}
      />
      {!grade ? (
        <figcaption className="text-[10px] font-medium tracking-wide text-muted-foreground">
          {rotulo}
          {ausente ? " · ausente" : null}
        </figcaption>
      ) : null}
    </figure>
  );
}
