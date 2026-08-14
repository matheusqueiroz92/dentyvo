import type { Convite } from "@/core/auth/domain/Convite";
import type { Profissional } from "@/core/auth/domain/Profissional";

import type { ConviteEquipeDTO, MembroEquipeDTO } from "./types";

export function membroParaDto(
  profissional: Profissional,
  email: string,
): MembroEquipeDTO {
  return {
    tipo: "membro",
    id: profissional.id,
    nome: profissional.nome,
    email,
    papel: profissional.papel,
    cro: profissional.cro,
    conviteStatus: null,
  };
}

export function conviteParaDto(
  convite: Convite,
  agora: Date = new Date(),
): ConviteEquipeDTO {
  return {
    tipo: "convite",
    id: convite.id,
    nome: "",
    email: convite.email,
    papel: convite.papel,
    cro: null,
    conviteStatus: convite.estaExpirado(agora) ? "expirado" : "pendente",
  };
}
