"use client";

import type { EstadoOdontograma } from "@/core/odontograma/domain/EstadoOdontograma";
import type { FaceOdontograma } from "@/core/odontograma/domain/FaceOdontograma";

import {
  ESTADOS_FACE,
  FILL_ESTADO,
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
const PENDING_STROKE = "hsl(var(--odontograma-pending))";

/**
 * SVG clínico em cruz: oclusal no centro; V/L/M/D ao redor.
 * Mesial/distal espelhados conforme o lado da arcada (mesial → linha média).
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
  const mesialDireita = mesialNaDireitaDoSvg(numeroDente);
  const faceEsquerda: FaceOdontograma = mesialDireita ? "distal" : "mesial";
  const faceDireita: FaceOdontograma = mesialDireita ? "mesial" : "distal";

  const estadoFace = (face: FaceOdontograma): EstadoOdontograma =>
    estadosFaces[face] ?? "higido";

  return (
    <div
      className={cn("flex w-11 flex-col items-center gap-0.5", className)}
      data-numero-dente={numeroDente}
      data-mesial-direita={mesialDireita ? "true" : "false"}
    >
      <svg
        viewBox="0 0 100 100"
        className={cn(
          "size-10 overflow-visible",
          (dentePendente || (facesPendentes && facesPendentes.size > 0)) &&
            "outline outline-1 outline-dashed outline-[hsl(var(--odontograma-pending))] outline-offset-1",
        )}
        role="img"
        aria-label={`Dente ${numeroDente}${ausente ? ", ausente ou extraído" : ""}`}
      >
        {ausente ? (
          <g>
            <title>{`Dente ${numeroDente}: ${ROTULOS_ESTADO.ausente_extraido}`}</title>
            <path
              d="M20 12 L80 12 L88 28 L88 72 L80 88 L20 88 L12 72 L12 28 Z"
              fill="hsl(var(--odontograma-ausente))"
              stroke={STROKE}
              strokeWidth={2}
              opacity={0.55}
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
              x1={22}
              y1={22}
              x2={78}
              y2={78}
              stroke={STROKE}
              strokeWidth={2.5}
              opacity={0.7}
              pointerEvents="none"
            />
            <line
              x1={78}
              y1={22}
              x2={22}
              y2={78}
              stroke={STROKE}
              strokeWidth={2.5}
              opacity={0.7}
              pointerEvents="none"
            />
          </g>
        ) : (
          <g>
            <FacePath
              face="vestibular"
              d="M12 8 L88 8 L70 30 L30 30 Z"
              estado={estadoFace("vestibular")}
              pendente={facesPendentes?.has("vestibular")}
              onClick={() => onFaceClick?.("vestibular")}
              onContextMenu={() => onDenteClick?.()}
              onDoubleClick={() => onHistorico?.()}
            />
            <FacePath
              face={faceEsquerda}
              d="M8 12 L30 30 L30 70 L8 88 Z"
              estado={estadoFace(faceEsquerda)}
              pendente={facesPendentes?.has(faceEsquerda)}
              onClick={() => onFaceClick?.(faceEsquerda)}
              onContextMenu={() => onDenteClick?.()}
              onDoubleClick={() => onHistorico?.()}
            />
            <FacePath
              face={faceDireita}
              d="M92 12 L70 30 L70 70 L92 88 Z"
              estado={estadoFace(faceDireita)}
              pendente={facesPendentes?.has(faceDireita)}
              onClick={() => onFaceClick?.(faceDireita)}
              onContextMenu={() => onDenteClick?.()}
              onDoubleClick={() => onHistorico?.()}
            />
            <FacePath
              face="lingual_palatina"
              d="M30 70 L70 70 L88 92 L12 92 Z"
              estado={estadoFace("lingual_palatina")}
              pendente={facesPendentes?.has("lingual_palatina")}
              onClick={() => onFaceClick?.("lingual_palatina")}
              onContextMenu={() => onDenteClick?.()}
              onDoubleClick={() => onHistorico?.()}
            />
            <FacePath
              face="oclusal"
              d="M30 30 L70 30 L70 70 L30 70 Z"
              estado={estadoFace("oclusal")}
              pendente={facesPendentes?.has("oclusal")}
              onClick={() => onFaceClick?.("oclusal")}
              onContextMenu={() => onDenteClick?.()}
              onDoubleClick={() => onHistorico?.()}
            />
          </g>
        )}
      </svg>
      {/* Botões auxiliares acessíveis (além de atalhos no SVG) */}
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
  estado,
  pendente,
  onClick,
  onContextMenu,
  onDoubleClick,
}: {
  face: FaceOdontograma;
  d: string;
  estado: EstadoOdontograma;
  pendente?: boolean;
  onClick: () => void;
  onContextMenu?: () => void;
  onDoubleClick?: () => void;
}) {
  const rotulo = `${ROTULOS_FACE[face]}: ${ROTULOS_ESTADO[estado]}`;
  return (
    <path
      d={d}
      fill={FILL_ESTADO[estado]}
      stroke={pendente ? PENDING_STROKE : STROKE}
      strokeWidth={pendente ? 2.5 : 1.5}
      strokeDasharray={pendente ? "3 2" : undefined}
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
