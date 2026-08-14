import type { Papel } from "@/core/auth/domain/Papel";

export type StatusConviteEquipe = "pendente" | "expirado";

export type MembroEquipeDTO = {
  tipo: "membro";
  id: string;
  nome: string;
  email: string;
  papel: Papel;
  cro: string | null;
  conviteStatus: null;
};

export type ConviteEquipeDTO = {
  tipo: "convite";
  id: string;
  nome: string;
  email: string;
  papel: Papel;
  cro: null;
  conviteStatus: StatusConviteEquipe;
};

export type LinhaEquipeDTO = MembroEquipeDTO | ConviteEquipeDTO;
