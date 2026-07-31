import type { Papel } from "@/core/auth/domain/Papel";
import type { TemaClinica } from "@/core/auth/domain/TemaClinica";

export type ContextoAppLayout = {
  clinicaId: string;
  clinicaNome: string;
  clinicaLogoUrl: string | null;
  /** Tema aplicado no shell; fallback `azul-padrao`. */
  clinicaTema: TemaClinica;
  usuario: {
    id: string;
    nome: string;
    papel: Papel;
    profissionalId: string;
  };
};
