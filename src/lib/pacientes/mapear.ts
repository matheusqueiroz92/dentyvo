import type { Paciente } from "@/core/paciente/domain/Paciente";

import { dataNascimentoParaIso } from "./formatacao";
import type { PacienteDTO } from "./types";

export function pacienteParaDto(paciente: Paciente): PacienteDTO {
  return {
    id: paciente.id,
    nome: paciente.nome,
    cpf: paciente.cpf.valor,
    telefone: paciente.telefone,
    dataNascimentoIso: dataNascimentoParaIso(paciente.dataNascimento),
    contatoEmergencia: paciente.contatoEmergencia,
  };
}
