import type { Clinica } from "@/core/auth/domain/Clinica";

import type { ClinicaGeralDTO } from "./types";

export function clinicaParaDtoGeral(clinica: Clinica): ClinicaGeralDTO {
  return {
    id: clinica.id,
    nome: clinica.nome,
    endereco: clinica.endereco,
    status: clinica.status,
    documento: {
      tipo: clinica.documento.tipo,
      valor: clinica.documento.valor,
    },
  };
}
