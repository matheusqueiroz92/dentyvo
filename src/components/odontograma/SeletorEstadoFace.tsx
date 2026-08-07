"use client";

import type { EstadoOdontograma } from "@/core/odontograma/domain/EstadoOdontograma";
import type { FaceOdontograma } from "@/core/odontograma/domain/FaceOdontograma";

import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@/components/ui/popover";
import {
  CLASSE_COR_ESTADO,
  ESTADOS_DENTE,
  ESTADOS_FACE,
  ROTULOS_ESTADO,
  ROTULOS_FACE,
} from "@/lib/odontograma/estados";
import { cn } from "@/lib/utils";

type SeletorEstadoFaceProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  numeroDente: number;
  face: FaceOdontograma;
  estadoAtual: EstadoOdontograma;
  onSelecionar: (estado: EstadoOdontograma) => void;
};

/** Seletor só com ESTADOS POR FACE. */
export function SeletorEstadoFace({
  open,
  onOpenChange,
  numeroDente,
  face,
  estadoAtual,
  onSelecionar,
}: SeletorEstadoFaceProps) {
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverAnchor asChild>
        <span className="pointer-events-none fixed left-1/2 top-[42%] size-0" />
      </PopoverAnchor>
      <PopoverContent
        align="center"
        side="top"
        className="w-56 p-2"
        aria-label={`Estado da face ${ROTULOS_FACE[face]} do dente ${numeroDente}`}
      >
        <p className="mb-2 px-1 text-xs font-medium text-muted-foreground">
          Dente{" "}
          <span className="tabular-nums text-foreground">{numeroDente}</span>
          {" · "}
          {ROTULOS_FACE[face]}
        </p>
        <p className="mb-1.5 px-1 text-[10px] text-muted-foreground">
          Estados por face
        </p>
        <ListaEstados
          estados={[...ESTADOS_FACE]}
          estadoAtual={estadoAtual}
          onSelecionar={(estado) => {
            onSelecionar(estado);
            onOpenChange(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}

type SeletorEstadoDenteInteiroProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  numeroDente: number;
  estadoAtual: EstadoOdontograma | null;
  onSelecionar: (estado: EstadoOdontograma) => void;
};

/** Seletor só com ESTADOS DE DENTE INTEIRO. */
export function SeletorEstadoDenteInteiro({
  open,
  onOpenChange,
  numeroDente,
  estadoAtual,
  onSelecionar,
}: SeletorEstadoDenteInteiroProps) {
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverAnchor asChild>
        <span className="pointer-events-none fixed left-1/2 top-[42%] size-0" />
      </PopoverAnchor>
      <PopoverContent
        align="center"
        side="top"
        className="w-64 p-2"
        aria-label={`Estado de dente inteiro do dente ${numeroDente}`}
      >
        <p className="mb-2 px-1 text-xs font-medium text-muted-foreground">
          Dente{" "}
          <span className="tabular-nums text-foreground">{numeroDente}</span>
          {" · estado do dente"}
        </p>
        <p className="mb-1.5 px-1 text-[10px] text-muted-foreground">
          Substitui as faces. Para voltar ao modo por face, registre um estado
          numa face.
        </p>
        <ListaEstados
          estados={[...ESTADOS_DENTE]}
          estadoAtual={estadoAtual}
          onSelecionar={(estado) => {
            onSelecionar(estado);
            onOpenChange(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}

function ListaEstados({
  estados,
  estadoAtual,
  onSelecionar,
}: {
  estados: EstadoOdontograma[];
  estadoAtual: EstadoOdontograma | null;
  onSelecionar: (estado: EstadoOdontograma) => void;
}) {
  return (
    <ul className="max-h-64 space-y-0.5 overflow-y-auto">
      {estados.map((estado) => (
        <li key={estado}>
          <button
            type="button"
            className={cn(
              "flex min-h-11 w-full items-center gap-2 rounded-md px-2 text-left text-sm hover:bg-muted",
              estado === estadoAtual && "bg-muted font-medium",
            )}
            onClick={() => onSelecionar(estado)}
          >
            <span
              className={cn(
                "size-3.5 shrink-0 rounded-sm border border-border",
                CLASSE_COR_ESTADO[estado],
              )}
              aria-hidden
            />
            <span>{ROTULOS_ESTADO[estado]}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}
