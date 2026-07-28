import type { Papel } from "./Papel";

/** Contexto autenticado exposto à application layer (spec 001). */
export type ContextoSessao = {
  usuarioId: string;
  clinicaId: string;
  papel: Papel;
  profissionalId: string;
};
