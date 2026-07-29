import { DadosInvalidosError, TenantMismatchError } from "@/core/shared/errors";

import {
  EstadoOdontogramaInvalidoError,
  EventoOdontogramaInvalidoError,
  FaceOdontogramaInvalidaError,
} from "./errors";
import {
  ehEstadoAusente,
  ehEstadoOdontograma,
  type EstadoOdontograma,
} from "./EstadoOdontograma";
import {
  ehFaceOdontograma,
  type FaceOdontograma,
} from "./FaceOdontograma";
import { NumeroDente } from "./NumeroDente";

export const NIVEIS_EVENTO_ODONTOGRAMA = ["face", "dente"] as const;
export type NivelEventoOdontograma = (typeof NIVEIS_EVENTO_ODONTOGRAMA)[number];

export type EventoOdontogramaProps = {
  id: string;
  clinicaId: string;
  prontuarioId: string;
  numeroDente: number;
  nivel: NivelEventoOdontograma;
  /** Obrigatória se `nivel = face`; sempre `null` se `nivel = dente`. */
  face: FaceOdontograma | null;
  estadoNovo: EstadoOdontograma;
  procedimentoId: string | null;
  registradoEm: Date;
  profissionalId: string;
  /**
   * Ordem monotônica de inserção (bigserial no banco).
   * `null` apenas em eventos ainda não persistidos; após `salvarEventos`
   * o adapter devolve o valor atribuído pelo banco.
   */
  sequencia: number | null;
};

/**
 * Evento append-only do odontograma (spec 004).
 * Imutável após criação; estado vigente = projeção do evento mais recente
 * por (dente+face) ou por dente (nível dente).
 *
 * Ordenação determinística: `registradoEm`, depois `sequencia` (não `id`).
 */
export class EventoOdontograma {
  readonly id: string;
  readonly clinicaId: string;
  readonly prontuarioId: string;
  readonly numeroDente: number;
  readonly nivel: NivelEventoOdontograma;
  readonly face: FaceOdontograma | null;
  readonly estadoNovo: EstadoOdontograma;
  readonly procedimentoId: string | null;
  readonly registradoEm: Date;
  readonly profissionalId: string;
  readonly sequencia: number | null;

  private constructor(props: EventoOdontogramaProps) {
    this.id = props.id;
    this.clinicaId = props.clinicaId;
    this.prontuarioId = props.prontuarioId;
    this.numeroDente = props.numeroDente;
    this.nivel = props.nivel;
    this.face = props.face;
    this.estadoNovo = props.estadoNovo;
    this.procedimentoId = props.procedimentoId;
    this.registradoEm = props.registradoEm;
    this.profissionalId = props.profissionalId;
    this.sequencia = props.sequencia;
  }

  /** Evento no nível da face (estado independente por face). */
  static criarFace(input: {
    id: string;
    clinicaId: string;
    prontuarioId: string;
    numeroDente: number;
    face: FaceOdontograma;
    estadoNovo: EstadoOdontograma;
    profissionalId: string;
    procedimentoId?: string | null;
    registradoEm?: Date;
  }): EventoOdontograma {
    const numero = NumeroDente.criar(input.numeroDente);
    const estado = assertEstado(input.estadoNovo);
    if (ehEstadoAusente(estado)) {
      throw new EventoOdontogramaInvalidoError(
        "Estado ausente_extraido é exclusivo do nível do dente; não pode ser registrado por face.",
      );
    }
    const face = assertFace(input.face);
    const registradoEm = input.registradoEm ?? new Date();
    assertDataValida(registradoEm, "registradoEm");

    return new EventoOdontograma({
      id: assertCampo(input.id, "id"),
      clinicaId: assertCampo(input.clinicaId, "clinicaId"),
      prontuarioId: assertCampo(input.prontuarioId, "prontuarioId"),
      numeroDente: numero.valor,
      nivel: "face",
      face,
      estadoNovo: estado,
      procedimentoId: normalizarOpcional(input.procedimentoId),
      registradoEm,
      profissionalId: assertCampo(input.profissionalId, "profissionalId"),
      sequencia: null,
    });
  }

  /**
   * Evento no nível do dente (ex.: `ausente_extraido`).
   * Dente ausente não possui estados de face vigentes (ver projeção).
   */
  static criarDente(input: {
    id: string;
    clinicaId: string;
    prontuarioId: string;
    numeroDente: number;
    estadoNovo: EstadoOdontograma;
    profissionalId: string;
    procedimentoId?: string | null;
    registradoEm?: Date;
  }): EventoOdontograma {
    const numero = NumeroDente.criar(input.numeroDente);
    const estado = assertEstado(input.estadoNovo);
    const registradoEm = input.registradoEm ?? new Date();
    assertDataValida(registradoEm, "registradoEm");

    return new EventoOdontograma({
      id: assertCampo(input.id, "id"),
      clinicaId: assertCampo(input.clinicaId, "clinicaId"),
      prontuarioId: assertCampo(input.prontuarioId, "prontuarioId"),
      numeroDente: numero.valor,
      nivel: "dente",
      face: null,
      estadoNovo: estado,
      procedimentoId: normalizarOpcional(input.procedimentoId),
      registradoEm,
      profissionalId: assertCampo(input.profissionalId, "profissionalId"),
      sequencia: null,
    });
  }

  static reconstituir(props: EventoOdontogramaProps): EventoOdontograma {
    if (props.sequencia != null) {
      assertSequencia(props.sequencia);
    }
    return new EventoOdontograma(props);
  }

  assertPertenceAClinica(clinicaId: string): void {
    if (this.clinicaId !== clinicaId) {
      throw new TenantMismatchError(clinicaId, this.clinicaId);
    }
  }

  ehNivelFace(): boolean {
    return this.nivel === "face";
  }

  ehNivelDente(): boolean {
    return this.nivel === "dente";
  }

  marcaDenteAusente(): boolean {
    return this.nivel === "dente" && ehEstadoAusente(this.estadoNovo);
  }
}

/**
 * Ordenação determinística para projeção e histórico:
 * 1. `registradoEm` ascendente
 * 2. `sequencia` ascendente (bigserial; desempate monotônico real)
 *
 * Eventos ainda não persistidos (`sequencia = null`) ficam depois dos
 * que já têm sequência — só relevantes em validação pré-persistência.
 */
export function compararEventos(
  a: EventoOdontograma,
  b: EventoOdontograma,
): number {
  const porData = a.registradoEm.getTime() - b.registradoEm.getTime();
  if (porData !== 0) return porData;

  const seqA = a.sequencia ?? Number.MAX_SAFE_INTEGER;
  const seqB = b.sequencia ?? Number.MAX_SAFE_INTEGER;
  return seqA - seqB;
}

function assertCampo(valor: string, campo: string): string {
  const trimmed = valor.trim();
  if (!trimmed) {
    throw new DadosInvalidosError(`${campo} do evento de odontograma é obrigatório.`);
  }
  return trimmed;
}

function assertEstado(estado: string): EstadoOdontograma {
  if (!ehEstadoOdontograma(estado)) {
    throw new EstadoOdontogramaInvalidoError(estado);
  }
  return estado;
}

function assertFace(face: string): FaceOdontograma {
  if (!ehFaceOdontograma(face)) {
    throw new FaceOdontogramaInvalidaError(face);
  }
  return face;
}

function assertSequencia(sequencia: number): void {
  if (!Number.isInteger(sequencia) || sequencia < 1) {
    throw new DadosInvalidosError(
      "sequencia do evento de odontograma deve ser um inteiro >= 1.",
    );
  }
}

function normalizarOpcional(valor: string | null | undefined): string | null {
  if (valor == null) return null;
  const trimmed = valor.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function assertDataValida(data: Date, campo: string): void {
  if (!(data instanceof Date) || Number.isNaN(data.getTime())) {
    throw new DadosInvalidosError(`${campo} inválida.`);
  }
}
