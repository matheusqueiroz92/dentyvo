/**
 * Faces clínicas registráveis no odontograma (spec 004) —
 * aplicáveis a dentição permanente e decídua.
 */
export const FACES_ODONTOGRAMA = [
  "vestibular",
  "lingual_palatina",
  "mesial",
  "distal",
  "oclusal",
] as const;

export type FaceOdontograma = (typeof FACES_ODONTOGRAMA)[number];

export function ehFaceOdontograma(valor: string): valor is FaceOdontograma {
  return (FACES_ODONTOGRAMA as readonly string[]).includes(valor);
}
