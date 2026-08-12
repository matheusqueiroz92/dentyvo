"use client";

import type { ReactNode } from "react";

import { IlustracaoTipoDente } from "@/components/odontograma/IlustracaoTipoDente";
import {
  fileirasVisiveis,
  type FileiraDenticao,
} from "@/lib/odontograma/fileiras";
import { cn } from "@/lib/utils";

export type GradeArcadasDenteCtx = {
  fileira: FileiraDenticao;
};

type GradeArcadasProps = {
  mostrarDecidua: boolean;
  /**
   * Conteúdo abaixo da ilustração (ex.: DenteSvg no odontograma,
   * indicador/botão no periograma).
   */
  renderConteudoDente: (
    numeroDente: number,
    ctx: GradeArcadasDenteCtx,
  ) => ReactNode;
  /** Classe extra no wrapper de cada dente. */
  denteClassName?: (
    numeroDente: number,
    ctx: GradeArcadasDenteCtx,
  ) => string | undefined;
  /** Marca visual de “ausente” na ilustração. */
  denteAusente?: (numeroDente: number) => boolean;
  className?: string;
};

/**
 * Layout compartilhado das 4 arcadas FDI + IlustracaoTipoDente.
 * Visibilidade da decídua controlada pelo pai (idade + toggle manual).
 */
export function GradeArcadas({
  mostrarDecidua,
  renderConteudoDente,
  denteClassName,
  denteAusente,
  className,
}: GradeArcadasProps) {
  const fileiras = fileirasVisiveis(mostrarDecidua);

  return (
    <div
      className={cn(
        "space-y-5 overflow-x-auto rounded-lg border border-border bg-card p-3 sm:p-4",
        className,
      )}
    >
      {fileiras.map((fileira) => (
        <FileiraArcada
          key={fileira.id}
          fileira={fileira}
          renderConteudoDente={renderConteudoDente}
          denteClassName={denteClassName}
          denteAusente={denteAusente}
        />
      ))}
    </div>
  );
}

function FileiraArcada({
  fileira,
  renderConteudoDente,
  denteClassName,
  denteAusente,
}: {
  fileira: FileiraDenticao;
  renderConteudoDente: GradeArcadasProps["renderConteudoDente"];
  denteClassName?: GradeArcadasProps["denteClassName"];
  denteAusente?: GradeArcadasProps["denteAusente"];
}) {
  const meio = fileira.numeros.length / 2;
  const ctx: GradeArcadasDenteCtx = { fileira };

  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-muted-foreground">{fileira.label}</p>
      <div className="flex flex-wrap items-end justify-center gap-x-0.5 gap-y-2 sm:gap-x-1">
        {fileira.numeros.map((numero, idx) => {
          const fdiEl = (
            <span className="text-[10px] tabular-nums text-muted-foreground">
              {numero}
            </span>
          );
          return (
            <div
              key={numero}
              className={cn(
                "flex flex-col items-center",
                idx === meio - 1 && "mr-2 sm:mr-3",
                denteClassName?.(numero, ctx),
              )}
            >
              {fileira.fdi === "acima" ? fdiEl : null}
              <IlustracaoTipoDente
                numeroDente={numero}
                variante="grade"
                ausente={denteAusente?.(numero) ?? false}
              />
              {renderConteudoDente(numero, ctx)}
              {fileira.fdi === "abaixo" ? fdiEl : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

type ToggleDeciduaProps = {
  mostrarDecidua: boolean;
  onAlternar: () => void;
};

/** Toggle manual da dentição decídua (mesmo copy do odontograma). */
export function ToggleDenticaoDecidua({
  mostrarDecidua,
  onAlternar,
}: ToggleDeciduaProps) {
  return (
    <button
      type="button"
      className="min-h-11 text-[13px] text-muted-foreground underline-offset-2 hover:text-foreground hover:underline sm:min-h-0"
      onClick={onAlternar}
      aria-pressed={mostrarDecidua}
    >
      {mostrarDecidua
        ? "Ocultar dentição decídua"
        : "Mostrar dentição decídua"}
    </button>
  );
}
