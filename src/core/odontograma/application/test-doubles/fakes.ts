import { compararEventos, EventoOdontograma } from "../../domain/EventoOdontograma";
import type {
  FiltrosHistoricoOdontograma,
  OdontogramaRepositoryPort,
} from "../ports/OdontogramaRepositoryPort";

/**
 * Fake append-only com atomicidade explícita (tudo-ou-nada).
 * - `salvarEventos` ou persiste o lote inteiro com `sequencia`, ou não persiste nada.
 * - `salvarEventosCalls` registra cada tentativa (para assertir ausência de
 *   chamada parcial quando o caso de uso rejeita o lote antes).
 * - **Contrato de ordem:** percorre o array em ordem e atribui `sequencia`
 *   monotônica (índice i < j ⇒ sequencia(i) < sequencia(j)) — espelha o
 *   adapter real; proibido paralelizar inserts do lote.
 */
export class FakeOdontogramaRepository implements OdontogramaRepositoryPort {
  readonly items = new Map<string, EventoOdontograma>();
  readonly salvarEventosCalls: EventoOdontograma[][] = [];
  private proximaSequencia = 1;

  /** Se true, a próxima chamada a `salvarEventos` falha sem persistir nada. */
  falharProximoSalvar = false;

  async salvarEventos(
    eventos: EventoOdontograma[],
  ): Promise<EventoOdontograma[]> {
    this.salvarEventosCalls.push([...eventos]);

    if (this.falharProximoSalvar) {
      this.falharProximoSalvar = false;
      throw new Error("Falha simulada no meio do lote — nada deve persistir.");
    }

    // Simula transação: monta o resultado completo antes de mutar `items`.
    const persistidos: EventoOdontograma[] = [];
    let seq = this.proximaSequencia;
    for (const evento of eventos) {
      persistidos.push(
        EventoOdontograma.reconstituir({
          id: evento.id,
          clinicaId: evento.clinicaId,
          prontuarioId: evento.prontuarioId,
          numeroDente: evento.numeroDente,
          nivel: evento.nivel,
          face: evento.face,
          estadoNovo: evento.estadoNovo,
          procedimentoId: evento.procedimentoId,
          registradoEm: evento.registradoEm,
          profissionalId: evento.profissionalId,
          sequencia: seq,
        }),
      );
      seq += 1;
    }

    for (const evento of persistidos) {
      this.items.set(evento.id, evento);
    }
    this.proximaSequencia = seq;
    return persistidos;
  }

  /** Seed de histórico já persistido (com sequencia). */
  seed(eventos: EventoOdontograma[]): void {
    for (const evento of eventos) {
      if (evento.sequencia == null) {
        throw new Error("Seed exige eventos com sequencia preenchida.");
      }
      this.items.set(evento.id, evento);
      if (evento.sequencia >= this.proximaSequencia) {
        this.proximaSequencia = evento.sequencia + 1;
      }
    }
  }

  async listarPorProntuario(
    clinicaId: string,
    prontuarioId: string,
    filtros?: FiltrosHistoricoOdontograma,
  ): Promise<EventoOdontograma[]> {
    let resultado = [...this.items.values()].filter(
      (e) => e.clinicaId === clinicaId && e.prontuarioId === prontuarioId,
    );

    if (filtros?.numeroDente != null) {
      resultado = resultado.filter((e) => e.numeroDente === filtros.numeroDente);
    }
    if (filtros?.face != null) {
      resultado = resultado.filter((e) => e.face === filtros.face);
    }
    if (filtros?.de != null) {
      const de = filtros.de;
      resultado = resultado.filter((e) => e.registradoEm >= de);
    }
    if (filtros?.ate != null) {
      const ate = filtros.ate;
      resultado = resultado.filter((e) => e.registradoEm <= ate);
    }

    return resultado.sort(compararEventos);
  }
}
