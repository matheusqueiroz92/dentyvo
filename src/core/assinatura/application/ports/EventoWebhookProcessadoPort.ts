/**
 * Persistência de ids de eventos já processados (idempotência at-least-once).
 * O `eventoId` é opaco — o adapter do gateway fornece o valor estável.
 */
export interface EventoWebhookProcessadoPort {
  jaProcessado(eventoId: string): Promise<boolean>;
  marcarProcessado(eventoId: string, processadoEm?: Date): Promise<void>;
}
