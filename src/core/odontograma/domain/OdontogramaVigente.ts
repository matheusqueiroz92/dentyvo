import { DenteAusenteSemFacesError } from "./errors";
import { ehEstadoAusente, type EstadoOdontograma } from "./EstadoOdontograma";
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
  /** Estado de nível do dente (ex.: ausente_extraido); null se nunca houve evento de dente. */
  estadoDente: EstadoOdontograma | null;
  eventoDenteId: string | null;
  registradoEmDente: Date | null;
  profissionalIdDente: string | null;
  sequenciaDente: number | null;
  /** Faces vigentes; sempre vazia se o dente estiver ausente. */
  faces: FaceVigente[];
};

/**
 * Visão agregada derivada dos eventos (não é snapshot persistido).
 * Estado atual de face = evento mais recente para dente+face
 * (ordem: `registradoEm`, depois `sequencia`).
 */
export type OdontogramaVigente = {
  prontuarioId: string;
  clinicaId: string;
  dentes: DenteVigente[];
};

/**
 * Projeta o estado vigente a partir do histórico append-only.
 * Eventos de face de dente ausente permanecem no histórico, mas não entram
 * na visão vigente (invariante ausente ⇒ sem faces vigentes).
 */
export function projetarOdontogramaVigente(
  prontuarioId: string,
  clinicaId: string,
  eventos: readonly EventoOdontograma[],
): OdontogramaVigente {
  const ordenados = [...eventos].sort(compararEventos);

  const estadoDentePorNumero = new Map<
    number,
    {
      estado: EstadoOdontograma;
      eventoId: string;
      registradoEm: Date;
      profissionalId: string;
      sequencia: number | null;
    }
  >();
  const facePorChave = new Map<string, FaceVigente>();

  for (const evento of ordenados) {
    if (evento.nivel === "dente") {
      estadoDentePorNumero.set(evento.numeroDente, {
        estado: evento.estadoNovo,
        eventoId: evento.id,
        registradoEm: evento.registradoEm,
        profissionalId: evento.profissionalId,
        sequencia: evento.sequencia,
      });
      continue;
    }

    if (evento.face == null) continue;

    facePorChave.set(chaveFace(evento.numeroDente, evento.face), {
      face: evento.face,
      estado: evento.estadoNovo,
      eventoId: evento.id,
      registradoEm: evento.registradoEm,
      profissionalId: evento.profissionalId,
      procedimentoId: evento.procedimentoId,
      sequencia: evento.sequencia,
    });
  }

  const numeros = new Set<number>([
    ...estadoDentePorNumero.keys(),
    ...[...facePorChave.keys()].map((k) => Number(k.split(":")[0])),
  ]);

  const dentes: DenteVigente[] = [...numeros]
    .sort((a, b) => a - b)
    .map((numeroDente) => {
      const nivelDente = estadoDentePorNumero.get(numeroDente) ?? null;
      const ausente = nivelDente != null && ehEstadoAusente(nivelDente.estado);

      const faces: FaceVigente[] = ausente
        ? []
        : [...facePorChave.entries()]
            .filter(([chave]) => chave.startsWith(`${numeroDente}:`))
            .map(([, face]) => face)
            .sort((a, b) => a.face.localeCompare(b.face));

      return {
        numeroDente,
        estadoDente: nivelDente?.estado ?? null,
        eventoDenteId: nivelDente?.eventoId ?? null,
        registradoEmDente: nivelDente?.registradoEm ?? null,
        profissionalIdDente: nivelDente?.profissionalId ?? null,
        sequenciaDente: nivelDente?.sequencia ?? null,
        faces,
      };
    });

  return { prontuarioId, clinicaId, dentes };
}

/**
 * Invariante: não registrar evento de face enquanto o dente estiver ausente
 * no estado vigente.
 */
export function assertPodeRegistrarEvento(
  vigente: OdontogramaVigente,
  evento: EventoOdontograma,
): void {
  if (!evento.ehNivelFace()) return;

  const dente = vigente.dentes.find((d) => d.numeroDente === evento.numeroDente);
  if (dente?.estadoDente != null && ehEstadoAusente(dente.estadoDente)) {
    throw new DenteAusenteSemFacesError(evento.numeroDente);
  }
}

/**
 * Valida o lote na ordem de registro, atualizando o conjunto de dentes ausentes
 * (inclui efeitos dos próprios eventos do lote). Usa o vigente já persistido
 * como base — dente ausente em consulta anterior bloqueia face em chamada futura.
 */
export function assertLoteNaoViolaDenteAusente(
  vigente: OdontogramaVigente,
  novos: readonly EventoOdontograma[],
): void {
  const ausentes = new Set(
    vigente.dentes
      .filter((d) => d.estadoDente != null && ehEstadoAusente(d.estadoDente))
      .map((d) => d.numeroDente),
  );

  for (const evento of novos) {
    if (evento.ehNivelFace() && ausentes.has(evento.numeroDente)) {
      throw new DenteAusenteSemFacesError(evento.numeroDente);
    }
    if (evento.ehNivelDente()) {
      if (ehEstadoAusente(evento.estadoNovo)) {
        ausentes.add(evento.numeroDente);
      } else {
        ausentes.delete(evento.numeroDente);
      }
    }
  }
}

function chaveFace(numeroDente: number, face: FaceOdontograma): string {
  return `${numeroDente}:${face}`;
}
