"use client";

import { Check } from "lucide-react";

import type { TemaClinica } from "@/core/auth/domain/TemaClinica";
import { cn } from "@/lib/utils";
import { TEMAS_CLINICA_UI } from "@/lib/tema-clinica";

type TemaClinicaPickerProps = {
  value: TemaClinica;
  onChange: (tema: TemaClinica) => void;
};

/** Seleção visual dos temas pré-definidos da clínica. */
export function TemaClinicaPicker({ value, onChange }: TemaClinicaPickerProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Tema visual da clínica"
      className="grid gap-3 sm:grid-cols-2"
    >
      {TEMAS_CLINICA_UI.map((tema) => {
        const selecionado = value === tema.id;
        return (
          <button
            key={tema.id}
            type="button"
            role="radio"
            aria-checked={selecionado}
            onClick={() => onChange(tema.id)}
            className={cn(
              "flex min-h-11 flex-col gap-3 rounded-md border border-border bg-card p-3 text-left transition-colors",
              "hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
              selecionado && "border-primary ring-2 ring-primary/30",
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold leading-5">{tema.nome}</p>
                <p className="text-xs leading-[18px] text-muted-foreground">
                  {tema.descricao}
                </p>
              </div>
              {selecionado ? (
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Check className="size-3.5" aria-hidden />
                </span>
              ) : null}
            </div>
            <div
              className="flex h-10 overflow-hidden rounded-[var(--radius-sm)] border border-border"
              aria-hidden
            >
              <span
                className="w-1/2"
                style={{ background: tema.swatches.primary }}
              />
              <span
                className="w-1/4"
                style={{ background: tema.swatches.accent }}
              />
              <span
                className="w-1/4"
                style={{ background: tema.swatches.surface }}
              />
            </div>
          </button>
        );
      })}
    </div>
  );
}
