import type { TemaClinica } from "@/core/auth/domain/TemaClinica";
import { TEMAS_CLINICA } from "@/core/auth/domain/TemaClinica";

export type TemaClinicaUi = {
  id: TemaClinica;
  nome: string;
  descricao: string;
  /** Swatches HSL (token-like) só para o preview do seletor — não usar em CSS de app. */
  swatches: {
    primary: string;
    accent: string;
    surface: string;
  };
};

/**
 * Metadados de UI dos temas pré-definidos.
 * As variáveis CSS reais ficam em `styles/tokens.css` via `[data-tema-clinica]`.
 */
export const TEMAS_CLINICA_UI: TemaClinicaUi[] = [
  {
    id: "azul-padrao",
    nome: "Azul padrão",
    descricao: "Identidade Dentyvo (padrão).",
    swatches: {
      primary: "hsl(210 92% 40%)",
      accent: "hsl(185 87% 42%)",
      surface: "hsl(216 45% 98%)",
    },
  },
  {
    id: "verde",
    nome: "Verde",
    descricao: "Tons clínicos de sucesso e calma.",
    swatches: {
      primary: "hsl(158 72% 31%)",
      accent: "hsl(174 78% 36%)",
      surface: "hsl(150 30% 97%)",
    },
  },
  {
    id: "roxo",
    nome: "Roxo",
    descricao: "Destaque sofisticado para a marca da clínica.",
    swatches: {
      primary: "hsl(267 52% 45%)",
      accent: "hsl(280 45% 55%)",
      surface: "hsl(270 35% 98%)",
    },
  },
  {
    id: "grafite",
    nome: "Grafite",
    descricao: "Neutro profissional, alto contraste.",
    swatches: {
      primary: "hsl(220 14% 28%)",
      accent: "hsl(210 12% 45%)",
      surface: "hsl(220 14% 96%)",
    },
  },
];

export function temaClinicaOuPadrao(
  tema: string | null | undefined,
): TemaClinica {
  if (tema && (TEMAS_CLINICA as readonly string[]).includes(tema)) {
    return tema as TemaClinica;
  }
  return "azul-padrao";
}
