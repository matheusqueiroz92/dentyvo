"use client";

import type { EstadoOdontograma } from "@/core/odontograma/domain/EstadoOdontograma";

import {
  CLASSE_COR_ESTADO,
  ESTADOS_ODONTOGRAMA,
  ROTULOS_ESTADO,
} from "@/lib/odontograma/estados";
import { cn } from "@/lib/utils";

export function LegendaEstados() {
  return (
    <div
      className="rounded-lg border border-border bg-card p-3"
      role="list"
      aria-label="Legenda de estados do odontograma"
    >
      <p className="mb-2 text-xs font-medium text-muted-foreground">
        Legenda de estados
      </p>
      <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
        {ESTADOS_ODONTOGRAMA.map((estado) => (
          <li
            key={estado}
            role="listitem"
            className="flex items-center gap-2 text-[13px] text-foreground"
          >
            <span
              className={cn(
                "size-3.5 shrink-0 rounded-sm border border-border",
                CLASSE_COR_ESTADO[estado as EstadoOdontograma],
              )}
              aria-hidden
            />
            <span>{ROTULOS_ESTADO[estado]}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
