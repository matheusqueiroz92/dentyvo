/**
 * Fileiras FDI compartilhadas entre odontograma e periograma
 * (permanente/decídua × superior/inferior).
 */
export type FileiraDenticao = {
  id: string;
  label: string;
  numeros: number[];
  fdi: "acima" | "abaixo";
  decidua?: boolean;
};

export const FILEIRAS_DENTICAO: FileiraDenticao[] = [
  {
    id: "perm-sup",
    label: "Permanente superior",
    numeros: [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28],
    fdi: "acima",
  },
  {
    id: "dec-sup",
    label: "Decídua superior",
    numeros: [55, 54, 53, 52, 51, 61, 62, 63, 64, 65],
    fdi: "acima",
    decidua: true,
  },
  {
    id: "dec-inf",
    label: "Decídua inferior",
    numeros: [85, 84, 83, 82, 81, 71, 72, 73, 74, 75],
    fdi: "abaixo",
    decidua: true,
  },
  {
    id: "perm-inf",
    label: "Permanente inferior",
    numeros: [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38],
    fdi: "abaixo",
  },
];

export function fileirasVisiveis(
  mostrarDecidua: boolean,
): FileiraDenticao[] {
  return FILEIRAS_DENTICAO.filter((f) => (f.decidua ? mostrarDecidua : true));
}
