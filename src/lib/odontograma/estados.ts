import type { EstadoOdontograma } from "@/core/odontograma/domain/EstadoOdontograma";
import { ESTADOS_ODONTOGRAMA } from "@/core/odontograma/domain/EstadoOdontograma";
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

/** Estados selecionáveis em face (ausente é só nível dente). */
export const ESTADOS_FACE = ESTADOS_ODONTOGRAMA.filter(
  (e) => e !== "ausente_extraido",
);

export { ESTADOS_ODONTOGRAMA, FACES_ODONTOGRAMA };

/**
 * Quadrantes FDI do lado direito do paciente (mesial à direita no SVG).
 * Q1/Q4 permanente, Q5/Q8 decídua.
 */
export function mesialNaDireitaDoSvg(numeroDente: number): boolean {
  const quadrante = Math.floor(numeroDente / 10);
  return quadrante === 1 || quadrante === 4 || quadrante === 5 || quadrante === 8;
}
