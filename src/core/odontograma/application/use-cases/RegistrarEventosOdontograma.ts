import { randomUUID } from "node:crypto";

import type { ProfissionalRepositoryPort } from "@/core/auth/application/ports/ProfissionalRepositoryPort";
import type { ProntuarioRepositoryPort } from "@/core/prontuario/application/ports/ProntuarioRepositoryPort";
import { ProntuarioNaoEncontradoError } from "@/core/prontuario/domain/errors";

import { NenhumEventoOdontogramaError, EventoOdontogramaInvalidoError } from "../../domain/errors";
import type { EstadoOdontograma } from "../../domain/EstadoOdontograma";
import {
  EventoOdontograma,
  type NivelEventoOdontograma,
} from "../../domain/EventoOdontograma";
import type { FaceOdontograma } from "../../domain/FaceOdontograma";
import {
  assertLoteNaoViolaDenteAusente,
  projetarOdontogramaVigente,
} from "../../domain/OdontogramaVigente";
import type { OdontogramaRepositoryPort } from "../ports/OdontogramaRepositoryPort";
import { autorizar, obterSolicitanteNaClinica } from "./helpers";

/**
 * Item de input de negócio (sem ids de evento / profissional / data).
 * Delivery valida com Zod; domínio valida FDI, face e estado na criação.
 */
export type EventoOdontogramaInput = {
  numeroDente: number;
  nivel: NivelEventoOdontograma;
  /** Obrigatória se `nivel = face`; omitida/null se `nivel = dente`. */
  face?: FaceOdontograma | null;
  estadoNovo: EstadoOdontograma;
  procedimentoId?: string | null;
};

/**
 * Input de negócio: sem `profissionalId`.
 * Delivery mapeia `ContextoSessao` → `clinicaId` + `solicitadoPorUsuarioId`;
 * o caso de uso usa `solicitante.id` como `profissionalId` dos eventos.
 */
export type RegistrarEventosOdontogramaInput = {
  clinicaId: string;
  solicitadoPorUsuarioId: string;
  prontuarioId: string;
  eventos: EventoOdontogramaInput[];
};

/**
 * Registra um ou mais eventos append-only no odontograma do prontuário (spec 004).
 */
export class RegistrarEventosOdontograma {
  constructor(
    private readonly odontogramaRepo: OdontogramaRepositoryPort,
    private readonly prontuarioRepo: ProntuarioRepositoryPort,
    private readonly profissionalRepo: ProfissionalRepositoryPort,
  ) {}

  async executar(
    input: RegistrarEventosOdontogramaInput,
  ): Promise<EventoOdontograma[]> {
    const solicitante = await obterSolicitanteNaClinica(
      this.profissionalRepo,
      input.solicitadoPorUsuarioId,
      input.clinicaId,
    );
    autorizar(solicitante, "registrar_eventos_odontograma");

    if (!input.eventos.length) {
      throw new NenhumEventoOdontogramaError();
    }

    const prontuario = await this.prontuarioRepo.buscarPorId(
      input.clinicaId,
      input.prontuarioId,
    );
    if (!prontuario) {
      throw new ProntuarioNaoEncontradoError(input.prontuarioId);
    }

    const historico = await this.odontogramaRepo.listarPorProntuario(
      input.clinicaId,
      prontuario.id,
    );
    const vigente = projetarOdontogramaVigente(
      prontuario.id,
      input.clinicaId,
      historico,
    );

    const novos = input.eventos.map((item) =>
      criarEventoDoInput(item, {
        clinicaId: input.clinicaId,
        prontuarioId: prontuario.id,
        profissionalId: solicitante.id,
      }),
    );

    assertLoteNaoViolaDenteAusente(vigente, novos);

    return this.odontogramaRepo.salvarEventos(novos);
  }
}

function criarEventoDoInput(
  item: EventoOdontogramaInput,
  ctx: { clinicaId: string; prontuarioId: string; profissionalId: string },
): EventoOdontograma {
  if (item.nivel === "dente") {
    return EventoOdontograma.criarDente({
      id: randomUUID(),
      clinicaId: ctx.clinicaId,
      prontuarioId: ctx.prontuarioId,
      numeroDente: item.numeroDente,
      estadoNovo: item.estadoNovo,
      profissionalId: ctx.profissionalId,
      procedimentoId: item.procedimentoId,
    });
  }

  if (item.face == null) {
    throw new EventoOdontogramaInvalidoError(
      "Face é obrigatória para evento de nível face.",
    );
  }

  return EventoOdontograma.criarFace({
    id: randomUUID(),
    clinicaId: ctx.clinicaId,
    prontuarioId: ctx.prontuarioId,
    numeroDente: item.numeroDente,
    face: item.face,
    estadoNovo: item.estadoNovo,
    profissionalId: ctx.profissionalId,
    procedimentoId: item.procedimentoId,
  });
}
