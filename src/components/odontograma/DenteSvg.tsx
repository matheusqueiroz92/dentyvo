"use client";

import { useId } from "react";

import type { EstadoOdontograma } from "@/core/odontograma/domain/EstadoOdontograma";
import { ESTADOS_ODONTOGRAMA } from "@/core/odontograma/domain/EstadoOdontograma";
import type { FaceOdontograma } from "@/core/odontograma/domain/FaceOdontograma";

import {
  ESTADOS_FACE,
  FILL_ESTADO,
  GRADIENTE_ESTADO,
  ROTULOS_ESTADO,
  ROTULOS_FACE,
  mesialNaDireitaDoSvg,
} from "@/lib/odontograma/estados";
import { cn } from "@/lib/utils";

export type EstadosFacesDente = Partial<Record<FaceOdontograma, EstadoOdontograma>>;

type DenteSvgProps = {
  numeroDente: number;
  estadosFaces: EstadosFacesDente;
  ausente: boolean;
  facesPendentes?: ReadonlySet<FaceOdontograma>;
  dentePendente?: boolean;
  onFaceClick?: (face: FaceOdontograma) => void;
  onDenteClick?: () => void;
  onHistorico?: () => void;
  className?: string;
};

const STROKE = "hsl(var(--odontograma-stroke))";
const STROKE_SOFT = "hsl(var(--odontograma-stroke-soft))";
const PENDING_STROKE = "hsl(var(--odontograma-pending))";

/**
 * Paths arredondados (vista oclusal em cruz).
 * Cantos suaves via curvas Q — acabamento clínico sem perder a grade de 5 faces.
 */
const PATHS = {
  vestibular: "M18 10 Q50 5 82 10 L70 29 Q50 33 30 29 Z",
  esquerda: "M10 18 Q5 50 10 82 L29 70 Q33 50 29 30 Z",
  direita: "M90 18 Q95 50 90 82 L71 70 Q67 50 71 30 Z",
  lingual: "M18 90 Q50 95 82 90 L70 71 Q50 67 30 71 Z",
  oclusal: "M32 32 Q50 28 68 32 Q72 50 68 68 Q50 72 32 68 Q28 50 32 32 Z",
  ausente:
    "M22 14 Q50 8 78 14 Q88 28 88 50 Q88 72 78 86 Q50 92 22 86 Q12 72 12 50 Q12 28 22 14 Z",
} as const;

/**
 * SVG clínico em cruz: oclusal no centro; V/L/M/D ao redor.
 * Mesial/distal espelhados conforme o lado da arcada (mesial → linha média).
 * Acabamento: gradiente por face, cantos arredondados e sombreamento sutil.
 */
export function DenteSvg({
  numeroDente,
  estadosFaces,
  ausente,
  facesPendentes,
  dentePendente,
  onFaceClick,
  onDenteClick,
  onHistorico,
  className,
}: DenteSvgProps) {
  const uid = useId().replace(/:/g, "");
  const mesialDireita = mesialNaDireitaDoSvg(numeroDente);
  const faceEsquerda: FaceOdontograma = mesialDireita ? "distal" : "mesial";
  const faceDireita: FaceOdontograma = mesialDireita ? "mesial" : "distal";

  const estadoFace = (face: FaceOdontograma): EstadoOdontograma =>
    estadosFaces[face] ?? "higido";

  const gradId = (estado: EstadoOdontograma) => `odonto-g-${uid}-${estado}`;
  const filterDepth = `odonto-depth-${uid}`;
  const filterPending = `odonto-pending-${uid}`;

  return (
    <div
      className={cn("flex w-12 flex-col items-center gap-0.5", className)}
      data-numero-dente={numeroDente}
      data-mesial-direita={mesialDireita ? "true" : "false"}
    >
      <svg
        viewBox="0 0 100 100"
        className={cn(
          "size-11 overflow-visible drop-shadow-sm",
          (dentePendente || (facesPendentes && facesPendentes.size > 0)) &&
            "outline outline-1 outline-dashed outline-[hsl(var(--odontograma-pending))] outline-offset-1 rounded-sm",
        )}
        role="img"
        aria-label={`Dente ${numeroDente}${ausente ? ", ausente ou extraído" : ""}`}
      >
        <defs>
          {ESTADOS_ODONTOGRAMA.map((estado) => {
            const { soft, base } = GRADIENTE_ESTADO[estado];
            return (
              <linearGradient
                key={estado}
                id={gradId(estado)}
                x1="15%"
                y1="10%"
                x2="85%"
                y2="90%"
              >
                <stop offset="0%" stopColor={soft} />
                <stop offset="55%" stopColor={base} />
                <stop offset="100%" stopColor={base} stopOpacity={0.92} />
              </linearGradient>
            );
          })}
          <filter
            id={filterDepth}
            x="-20%"
            y="-20%"
            width="140%"
            height="140%"
          >
            <feDropShadow
              dx="0.4"
              dy="0.8"
              stdDeviation="0.9"
              floodColor={STROKE}
              floodOpacity="0.18"
            />
          </filter>
          <filter
            id={filterPending}
            x="-25%"
            y="-25%"
            width="150%"
            height="150%"
          >
            <feDropShadow
              dx="0"
              dy="0"
              stdDeviation="1.2"
              floodColor={PENDING_STROKE}
              floodOpacity="0.45"
            />
          </filter>
        </defs>

        {ausente ? (
          <g>
            <title>{`Dente ${numeroDente}: ${ROTULOS_ESTADO.ausente_extraido}`}</title>
            <path
              d={PATHS.ausente}
              fill={`url(#${gradId("ausente_extraido")})`}
              stroke={STROKE}
              strokeWidth={1.75}
              opacity={0.7}
              filter={`url(#${filterDepth})`}
              className="cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                onDenteClick?.();
              }}
              onDoubleClick={(e) => {
                e.stopPropagation();
                onHistorico?.();
              }}
            />
            <line
              x1={28}
              y1={28}
              x2={72}
              y2={72}
              stroke={STROKE}
              strokeWidth={2.25}
              strokeLinecap="round"
              opacity={0.65}
              pointerEvents="none"
            />
            <line
              x1={72}
              y1={28}
              x2={28}
              y2={72}
              stroke={STROKE}
              strokeWidth={2.25}
              strokeLinecap="round"
              opacity={0.65}
              pointerEvents="none"
            />
          </g>
        ) : (
          <g filter={`url(#${filterDepth})`}>
            <FacePath
              face="vestibular"
              d={PATHS.vestibular}
              fillUrl={`url(#${gradId(estadoFace("vestibular"))})`}
              estado={estadoFace("vestibular")}
              pendente={facesPendentes?.has("vestibular")}
              pendingFilter={`url(#${filterPending})`}
              onClick={() => onFaceClick?.("vestibular")}
              onContextMenu={() => onDenteClick?.()}
              onDoubleClick={() => onHistorico?.()}
            />
            <FacePath
              face={faceEsquerda}
              d={PATHS.esquerda}
              fillUrl={`url(#${gradId(estadoFace(faceEsquerda))})`}
              estado={estadoFace(faceEsquerda)}
              pendente={facesPendentes?.has(faceEsquerda)}
              pendingFilter={`url(#${filterPending})`}
              onClick={() => onFaceClick?.(faceEsquerda)}
              onContextMenu={() => onDenteClick?.()}
              onDoubleClick={() => onHistorico?.()}
            />
            <FacePath
              face={faceDireita}
              d={PATHS.direita}
              fillUrl={`url(#${gradId(estadoFace(faceDireita))})`}
              estado={estadoFace(faceDireita)}
              pendente={facesPendentes?.has(faceDireita)}
              pendingFilter={`url(#${filterPending})`}
              onClick={() => onFaceClick?.(faceDireita)}
              onContextMenu={() => onDenteClick?.()}
              onDoubleClick={() => onHistorico?.()}
            />
            <FacePath
              face="lingual_palatina"
              d={PATHS.lingual}
              fillUrl={`url(#${gradId(estadoFace("lingual_palatina"))})`}
              estado={estadoFace("lingual_palatina")}
              pendente={facesPendentes?.has("lingual_palatina")}
              pendingFilter={`url(#${filterPending})`}
              onClick={() => onFaceClick?.("lingual_palatina")}
              onContextMenu={() => onDenteClick?.()}
              onDoubleClick={() => onHistorico?.()}
            />
            <FacePath
              face="oclusal"
              d={PATHS.oclusal}
              fillUrl={`url(#${gradId(estadoFace("oclusal"))})`}
              estado={estadoFace("oclusal")}
              pendente={facesPendentes?.has("oclusal")}
              pendingFilter={`url(#${filterPending})`}
              onClick={() => onFaceClick?.("oclusal")}
              onContextMenu={() => onDenteClick?.()}
              onDoubleClick={() => onHistorico?.()}
            />
            {/* Separadores sutis entre faces (profundidade sem depender só de cor) */}
            <g pointerEvents="none" opacity={0.35}>
              <path
                d="M30 29 L70 29"
                stroke={STROKE_SOFT}
                strokeWidth={1.1}
                fill="none"
              />
              <path
                d="M29 30 L29 70"
                stroke={STROKE_SOFT}
                strokeWidth={1.1}
                fill="none"
              />
              <path
                d="M71 30 L71 70"
                stroke={STROKE_SOFT}
                strokeWidth={1.1}
                fill="none"
              />
              <path
                d="M30 71 L70 71"
                stroke={STROKE_SOFT}
                strokeWidth={1.1}
                fill="none"
              />
            </g>
          </g>
        )}
      </svg>
      <div className="flex gap-0.5">
        <button
          type="button"
          className="min-h-0 rounded px-1 py-0.5 text-[9px] text-muted-foreground hover:bg-muted hover:text-foreground"
          title={
            ausente
              ? "Desmarcar ausente/extraído"
              : "Marcar ausente/extraído (também: botão direito)"
          }
          onClick={() => onDenteClick?.()}
        >
          {ausente ? "↻" : "✕"}
        </button>
        <button
          type="button"
          className="min-h-0 rounded px-1 py-0.5 text-[9px] text-muted-foreground hover:bg-muted hover:text-foreground"
          title="Histórico do dente (também: duplo clique)"
          onClick={() => onHistorico?.()}
        >
          H
        </button>
      </div>
    </div>
  );
}

function FacePath({
  face,
  d,
  fillUrl,
  estado,
  pendente,
  pendingFilter,
  onClick,
  onContextMenu,
  onDoubleClick,
}: {
  face: FaceOdontograma;
  d: string;
  fillUrl: string;
  estado: EstadoOdontograma;
  pendente?: boolean;
  pendingFilter: string;
  onClick: () => void;
  onContextMenu?: () => void;
  onDoubleClick?: () => void;
}) {
  const rotulo = `${ROTULOS_FACE[face]}: ${ROTULOS_ESTADO[estado]}`;
  return (
    <path
      d={d}
      fill={fillUrl}
      stroke={pendente ? PENDING_STROKE : STROKE}
      strokeWidth={pendente ? 2.25 : 1.35}
      strokeLinejoin="round"
      strokeDasharray={pendente ? "3.5 2.5" : undefined}
      filter={pendente ? pendingFilter : undefined}
      className="cursor-pointer focus:outline-none focus-visible:stroke-[hsl(var(--ring))]"
      tabIndex={0}
      role="button"
      aria-label={rotulo}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onContextMenu?.();
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onDoubleClick?.();
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          e.stopPropagation();
          onClick();
        }
      }}
    >
      <title>{rotulo}</title>
    </path>
  );
}

/** Exportado para testes / seletor — lista de faces válidas. */
export const FACES_CLICAVEIS = ESTADOS_FACE;

/** Mantém FILL_ESTADO disponível para consumidores que precisem de cor sólida. */
export { FILL_ESTADO };
