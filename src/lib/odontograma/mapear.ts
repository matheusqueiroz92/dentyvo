import type { EventoOdontograma } from "@/core/odontograma/domain/EventoOdontograma";
import type { OdontogramaVigente } from "@/core/odontograma/domain/OdontogramaVigente";

import type {
  EventoOdontogramaDTO,
  OdontogramaVigenteDTO,
} from "./types";

export function odontogramaVigenteParaDto(
  vigente: OdontogramaVigente,
): OdontogramaVigenteDTO {
  return {
    prontuarioId: vigente.prontuarioId,
    dentes: vigente.dentes.map((d) => ({
      numeroDente: d.numeroDente,
      estadoDente: d.estadoDente,
      eventoDenteId: d.eventoDenteId,
      registradoEmDenteIso: d.registradoEmDente?.toISOString() ?? null,
      profissionalIdDente: d.profissionalIdDente,
      faces: d.faces.map((f) => ({
        face: f.face,
        estado: f.estado,
        eventoId: f.eventoId,
        registradoEmIso: f.registradoEm.toISOString(),
        profissionalId: f.profissionalId,
        procedimentoId: f.procedimentoId,
      })),
    })),
  };
}

export function eventoOdontogramaParaDto(
  evento: EventoOdontograma,
  profissionalNome: string,
): EventoOdontogramaDTO {
  return {
    id: evento.id,
    numeroDente: evento.numeroDente,
    nivel: evento.nivel,
    face: evento.face,
    estadoNovo: evento.estadoNovo,
    procedimentoId: evento.procedimentoId,
    registradoEmIso: evento.registradoEm.toISOString(),
    profissionalId: evento.profissionalId,
    profissionalNome,
    sequencia: evento.sequencia,
  };
}
