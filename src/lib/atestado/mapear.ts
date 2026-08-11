import type { Atestado } from "@/core/atestado/domain/Atestado";

import {
  formatarPeriodoAfastamento,
  isoCivilUtc,
  resumirMotivo,
} from "./periodo";
import type { AtestadoListaDTO } from "./types";

export function atestadoParaListaDto(
  atestado: Atestado,
  profissionalNome: string,
): AtestadoListaDTO {
  return {
    id: atestado.id,
    emitidaEmIso: atestado.emitidaEm.toISOString(),
    profissionalNome,
    motivo: atestado.motivo,
    motivoResumo: resumirMotivo(atestado.motivo),
    cid: atestado.cid,
    dataInicioIso: isoCivilUtc(atestado.dataInicio),
    dataFimIso: isoCivilUtc(atestado.dataFim),
    quantidadeDias: atestado.quantidadeDias,
    periodoRotulo: formatarPeriodoAfastamento(
      atestado.dataInicio,
      atestado.dataFim,
      atestado.quantidadeDias,
    ),
  };
}
