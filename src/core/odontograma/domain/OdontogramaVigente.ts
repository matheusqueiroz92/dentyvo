import { EstadoDenteInteiroConflitanteError } from "./errors";
import type { EstadoOdontograma } from "./EstadoOdontograma";
import type { FaceOdontograma } from "./FaceOdontograma";
import { compararEventos, type EventoOdontograma } from "./EventoOdontograma";

export type FaceVigente = {
  face: FaceOdontograma;
  estado: EstadoOdontograma;
  eventoId: string;
  registradoEm: Date;
  profissionalId: string;
  procedimentoId: string | null;
  sequencia: number | null;
};

export type DenteVigente = {
  numeroDente: number;
  /**
   * Estado de dente inteiro vigente; `null` se nunca houve, ou se um evento
   * de face posterior encerrou o último estado de dente inteiro.
   */
  estadoDente: EstadoOdontograma | null;
  eventoDenteId: string | null;
  registradoEmDente: Date | null;
  profissionalIdDente: string | null;
  sequenciaDente: number | null;
  /**
   * Faces vigentes **posteriores** ao último evento de dente inteiro
   * (vazia se o dente inteiro ainda estiver vigente).
   */
  faces: FaceVigente[];
};

/**
 * Visão agregada derivada dos eventos (não é snapshot persistido).
 * Bidirecional (spec 004):
 * - último `nivel = dente` sem face posterior → `estadoDente` vigente, faces limpas;
 * - face posterior a esse dente → encerra dente inteiro; faces pós-corte vigem.
 */
export type OdontogramaVigente = {
  prontuarioId: string;
  clinicaId: string;
  dentes: DenteVigente[];
};

type MetaDente = {
  estado: EstadoOdontograma;
  eventoId: string;
  registradoEm: Date;
  profissionalId: string;
  sequencia: number | null;
};

/**
 * Projeta o estado vigente a partir do histórico append-only.
 * Modelo sparse: dente/face sem evento não materializa `higido`.
 *
 * **Leitura graciosa:** nunca lança por histórico que viole a regra de
 * conflito de dente inteiro (dado pré-correção). O evento de dente mais
 * recente (`registradoEm`, `sequencia`) vence; `EstadoDenteInteiroConflitanteError`
 * aplica-se só a **novos** registros (`assertLoteNaoViolaEstadoDenteInteiro`).
 */
export function projetarOdontogramaVigente(
  prontuarioId: string,
  clinicaId: string,
  eventos: readonly EventoOdontograma[],
): OdontogramaVigente {
  const ordenados = [...eventos].sort(compararEventos);
  const porDente = new Map<number, EventoOdontograma[]>();

  for (const evento of ordenados) {
    const lista = porDente.get(evento.numeroDente) ?? [];
    lista.push(evento);
    porDente.set(evento.numeroDente, lista);
  }

  const dentes: DenteVigente[] = [...porDente.keys()]
    .sort((a, b) => a - b)
    .map((numeroDente) => projetarDente(numeroDente, porDente.get(numeroDente)!));

  return { prontuarioId, clinicaId, dentes };
}

function projetarDente(
  numeroDente: number,
  eventosDoDente: readonly EventoOdontograma[],
): DenteVigente {
  let ultimoDente: MetaDente | null = null;
  let indiceUltimoDente = -1;

  for (let i = 0; i < eventosDoDente.length; i++) {
    const evento = eventosDoDente[i]!;
    if (evento.nivel === "dente") {
      ultimoDente = {
        estado: evento.estadoNovo,
        eventoId: evento.id,
        registradoEm: evento.registradoEm,
        profissionalId: evento.profissionalId,
        sequencia: evento.sequencia,
      };
      indiceUltimoDente = i;
    }
  }

  const facesAposCorte = new Map<FaceOdontograma, FaceVigente>();
  const inicioFaces = indiceUltimoDente + 1;

  for (let i = inicioFaces; i < eventosDoDente.length; i++) {
    const evento = eventosDoDente[i]!;
    if (evento.nivel !== "face" || evento.face == null) continue;
    facesAposCorte.set(evento.face, {
      face: evento.face,
      estado: evento.estadoNovo,
      eventoId: evento.id,
      registradoEm: evento.registradoEm,
      profissionalId: evento.profissionalId,
      procedimentoId: evento.procedimentoId,
      sequencia: evento.sequencia,
    });
  }

  const haFacePosterior = facesAposCorte.size > 0;

  if (ultimoDente != null && !haFacePosterior) {
    return {
      numeroDente,
      estadoDente: ultimoDente.estado,
      eventoDenteId: ultimoDente.eventoId,
      registradoEmDente: ultimoDente.registradoEm,
      profissionalIdDente: ultimoDente.profissionalId,
      sequenciaDente: ultimoDente.sequencia,
      faces: [],
    };
  }

  return {
    numeroDente,
    estadoDente: null,
    eventoDenteId: null,
    registradoEmDente: null,
    profissionalIdDente: null,
    sequenciaDente: null,
    faces: [...facesAposCorte.values()].sort((a, b) =>
      a.face.localeCompare(b.face),
    ),
  };
}

/**
 * Valida o lote na **ordem do array `novos`**.
 *
 * **Contrato de ordem (obrigatório — não é coincidência de implementação):**
 * A ordem do array é a mesma ordem em que `OdontogramaRepositoryPort.salvarEventos`
 * atribui `sequencia` (índice i < j ⇒ sequencia(i) < sequencia(j)). Por isso
 * este assert e `projetarOdontogramaVigente` (que ordena por
 * `registradoEm`/`sequencia`) concordam sobre o estado final do lote
 * **depois** da persistência.
 *
 * O caso de uso deve:
 * 1. montar `novos` na ordem de `input.eventos` (sem reordenar);
 * 2. chamar este assert com esse array;
 * 3. passar o **mesmo** array a `salvarEventos` (insert sequencial; sem
 *    `Promise.all` no lote).
 *
 * Dois estados de dente inteiro **diferentes** no mesmo dente (vigente
 * persistido ou dentro do lote) → `EstadoDenteInteiroConflitanteError`.
 * Face no lote encerra o vigente daquele dente (permite novo dente
 * inteiro depois).
 */
export function assertLoteNaoViolaEstadoDenteInteiro(
  vigente: OdontogramaVigente,
  novos: readonly EventoOdontograma[],
): void {
  const estadoVigentePorDente = new Map<number, EstadoOdontograma>();
  for (const dente of vigente.dentes) {
    if (dente.estadoDente != null) {
      estadoVigentePorDente.set(dente.numeroDente, dente.estadoDente);
    }
  }

  for (const evento of novos) {
    if (evento.ehNivelFace()) {
      estadoVigentePorDente.delete(evento.numeroDente);
      continue;
    }

    if (!evento.ehNivelDente()) continue;

    const atual = estadoVigentePorDente.get(evento.numeroDente);
    if (atual != null && atual !== evento.estadoNovo) {
      throw new EstadoDenteInteiroConflitanteError(
        evento.numeroDente,
        atual,
        evento.estadoNovo,
      );
    }
    estadoVigentePorDente.set(evento.numeroDente, evento.estadoNovo);
  }
}
