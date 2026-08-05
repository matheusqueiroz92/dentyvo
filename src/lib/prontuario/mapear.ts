import type { Anamnese } from "@/core/anamnese/domain/Anamnese";
import type { Prontuario } from "@/core/prontuario/domain/Prontuario";

import type { AnamneseDTO, ProntuarioDTO, RespostasAnamneseDTO } from "./types";

export function prontuarioParaDto(prontuario: Prontuario): ProntuarioDTO {
  return {
    id: prontuario.id,
    pacienteId: prontuario.pacienteId,
    criadoEmIso: prontuario.criadoEm.toISOString(),
  };
}

export function anamneseParaDto(
  anamnese: Anamnese,
  preenchidoPorNome: string,
): AnamneseDTO {
  const props = anamnese.respostas.toProps();
  const respostas: RespostasAnamneseDTO = {
    historicoMedico: props.historicoMedico,
    alergias: props.alergias,
    medicacoesEmUso: props.medicacoesEmUso,
    condicoesPreexistentes: props.condicoesPreexistentes,
  };

  return {
    id: anamnese.id,
    prontuarioId: anamnese.prontuarioId,
    versao: anamnese.versao,
    respostas,
    preenchidoEmIso: anamnese.preenchidoEm.toISOString(),
    preenchidoPorProfissionalId: anamnese.preenchidoPorProfissionalId,
    preenchidoPorNome,
  };
}
