import type { EstadoOdontograma } from "@/core/odontograma/domain/EstadoOdontograma";
import type { FaceOdontograma } from "@/core/odontograma/domain/FaceOdontograma";
import type { NivelEventoOdontograma } from "@/core/odontograma/domain/EventoOdontograma";

export type FaceVigenteDTO = {
  face: FaceOdontograma;
  estado: EstadoOdontograma;
  eventoId: string;
  registradoEmIso: string;
  profissionalId: string;
  procedimentoId: string | null;
};

export type DenteVigenteDTO = {
  numeroDente: number;
  estadoDente: EstadoOdontograma | null;
  eventoDenteId: string | null;
  registradoEmDenteIso: string | null;
  profissionalIdDente: string | null;
  faces: FaceVigenteDTO[];
};

export type OdontogramaVigenteDTO = {
  prontuarioId: string;
  dentes: DenteVigenteDTO[];
};

export type EventoOdontogramaDTO = {
  id: string;
  numeroDente: number;
  nivel: NivelEventoOdontograma;
  face: FaceOdontograma | null;
  estadoNovo: EstadoOdontograma;
  procedimentoId: string | null;
  registradoEmIso: string;
  profissionalId: string;
  profissionalNome: string;
  sequencia: number | null;
};

export type EventoOdontogramaPendenteDTO = {
  numeroDente: number;
  nivel: NivelEventoOdontograma;
  face?: FaceOdontograma | null;
  estadoNovo: EstadoOdontograma;
};
