import type { PapelPlataforma } from "./PapelPlataforma";

/**
 * Contexto autenticado do painel `/admin` (spec 009).
 * Deliberadamente sem `clinicaId` — distinto de `ContextoSessao` (001).
 */
export type ContextoSessaoPlataforma = {
  usuarioPlataformaId: string;
  papel: PapelPlataforma;
};
