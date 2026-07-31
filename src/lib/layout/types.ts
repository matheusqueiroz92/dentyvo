import type { Papel } from "@/core/auth/domain/Papel";

export type ContextoAppLayout = {
  clinicaId: string;
  clinicaNome: string;
  usuario: {
    id: string;
    nome: string;
    papel: Papel;
    profissionalId: string;
  };
};
