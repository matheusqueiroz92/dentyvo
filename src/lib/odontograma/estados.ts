import type { EstadoOdontograma } from "@/core/odontograma/domain/EstadoOdontograma";
import {
  ESTADOS_DENTE_INTEIRO,
  ESTADOS_ODONTOGRAMA,
  ESTADOS_POR_FACE,
} from "@/core/odontograma/domain/EstadoOdontograma";
import type { FaceOdontograma } from "@/core/odontograma/domain/FaceOdontograma";
import { FACES_ODONTOGRAMA } from "@/core/odontograma/domain/FaceOdontograma";

export const ROTULOS_ESTADO: Record<EstadoOdontograma, string> = {
  higido: "Hígido",
  cariado: "Cariado",
  restaurado: "Restaurado",
  ausente_extraido: "Ausente / extraído",
  indicado_extracao: "Indicado para extração",
  protese_coroa: "Prótese / coroa",
  implante: "Implante",
  fraturado: "Fraturado",
  tratamento_endodontico: "Tratamento endodôntico",
  selante: "Selante",
};

/** Classes Tailwind bridgeadas aos tokens --odontograma-* (sem HEX). */
export const CLASSE_COR_ESTADO: Record<EstadoOdontograma, string> = {
  higido: "bg-odontograma-higido",
  cariado: "bg-odontograma-cariado",
  restaurado: "bg-odontograma-restaurado",
  ausente_extraido: "bg-odontograma-ausente",
  indicado_extracao: "bg-odontograma-indicado-extracao",
  protese_coroa: "bg-odontograma-protese",
  implante: "bg-odontograma-implante",
  fraturado: "bg-odontograma-fraturado",
  tratamento_endodontico: "bg-odontograma-endodontico",
  selante: "bg-odontograma-selante",
};

/** Fill SVG via token CSS (hsl(var(--…))). */
export const FILL_ESTADO: Record<EstadoOdontograma, string> = {
  higido: "hsl(var(--odontograma-higido))",
  cariado: "hsl(var(--odontograma-cariado))",
  restaurado: "hsl(var(--odontograma-restaurado))",
  ausente_extraido: "hsl(var(--odontograma-ausente))",
  indicado_extracao: "hsl(var(--odontograma-indicado-extracao))",
  protese_coroa: "hsl(var(--odontograma-protese))",
  implante: "hsl(var(--odontograma-implante))",
  fraturado: "hsl(var(--odontograma-fraturado))",
  tratamento_endodontico: "hsl(var(--odontograma-endodontico))",
  selante: "hsl(var(--odontograma-selante))",
};

export const ROTULOS_FACE: Record<FaceOdontograma, string> = {
  vestibular: "Vestibular",
  lingual_palatina: "Lingual / palatina",
  mesial: "Mesial",
  distal: "Distal",
  oclusal: "Oclusal",
};

/** Estados selecionáveis em face (`nivel = face`). */
export const ESTADOS_FACE = ESTADOS_POR_FACE;

/** Estados selecionáveis no dente como um todo (`nivel = dente`). */
export const ESTADOS_DENTE = ESTADOS_DENTE_INTEIRO;

export { ESTADOS_ODONTOGRAMA, ESTADOS_POR_FACE, ESTADOS_DENTE_INTEIRO, FACES_ODONTOGRAMA };

/**
 * Quadrantes FDI do lado direito do paciente (mesial à direita no SVG).
 * Q1/Q4 permanente, Q5/Q8 decídua.
 */
export function mesialNaDireitaDoSvg(numeroDente: number): boolean {
  const quadrante = Math.floor(numeroDente / 10);
  return quadrante === 1 || quadrante === 4 || quadrante === 5 || quadrante === 8;
}

/** Tipo anatômico pelo dígito de posição FDI (permanente e decídua). */
export type TipoDenteAnatomico =
  | "incisivo"
  | "canino"
  | "pre_molar"
  | "molar";

export const ROTULOS_TIPO_DENTE: Record<TipoDenteAnatomico, string> = {
  incisivo: "Incisivo",
  canino: "Canino",
  pre_molar: "Pré-molar",
  molar: "Molar",
};

/**
 * Permanente: 1–2 incisivo, 3 canino, 4–5 pré-molar, 6–8 molar.
 * Decídua: 1–2 incisivo, 3 canino, 4–5 molar (sem pré-molar).
 */
export function tipoDentePorFdi(numeroDente: number): TipoDenteAnatomico {
  const posicao = numeroDente % 10;
  const permanente = Math.floor(numeroDente / 10) <= 4;

  if (posicao === 1 || posicao === 2) return "incisivo";
  if (posicao === 3) return "canino";
  if (permanente && (posicao === 4 || posicao === 5)) return "pre_molar";
  return "molar";
}

/** Par de tokens CSS (base + soft) para gradiente SVG por estado. */
export const GRADIENTE_ESTADO: Record<
  EstadoOdontograma,
  { base: string; soft: string }
> = {
  higido: {
    soft: "hsl(var(--odontograma-higido-soft))",
    base: "hsl(var(--odontograma-higido))",
  },
  cariado: {
    soft: "hsl(var(--odontograma-cariado-soft))",
    base: "hsl(var(--odontograma-cariado))",
  },
  restaurado: {
    soft: "hsl(var(--odontograma-restaurado-soft))",
    base: "hsl(var(--odontograma-restaurado))",
  },
  ausente_extraido: {
    soft: "hsl(var(--odontograma-ausente-soft))",
    base: "hsl(var(--odontograma-ausente))",
  },
  indicado_extracao: {
    soft: "hsl(var(--odontograma-indicado-extracao-soft))",
    base: "hsl(var(--odontograma-indicado-extracao))",
  },
  protese_coroa: {
    soft: "hsl(var(--odontograma-protese-soft))",
    base: "hsl(var(--odontograma-protese))",
  },
  implante: {
    soft: "hsl(var(--odontograma-implante-soft))",
    base: "hsl(var(--odontograma-implante))",
  },
  fraturado: {
    soft: "hsl(var(--odontograma-fraturado-soft))",
    base: "hsl(var(--odontograma-fraturado))",
  },
  tratamento_endodontico: {
    soft: "hsl(var(--odontograma-endodontico-soft))",
    base: "hsl(var(--odontograma-endodontico))",
  },
  selante: {
    soft: "hsl(var(--odontograma-selante-soft))",
    base: "hsl(var(--odontograma-selante))",
  },
};
