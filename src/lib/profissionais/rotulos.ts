import type { Papel } from "@/core/auth/domain/Papel";

export const ROTULO_PAPEL: Record<Papel, string> = {
  admin: "Administrador",
  dentista: "Dentista",
  recepcao: "Recepção",
};

export const MENSAGEM_CRO_OBRIGATORIO =
  "CRO é obrigatório para o papel dentista.";
