import type { AuditoriaLog } from "../../domain/AuditoriaLog";

/**
 * Persistência de trilha de auditoria (spec 003).
 * Reaproveitada pela feature 009 (admin plataforma) — ator pode ser
 * profissional da clínica ou `UsuarioPlataforma`.
 */
export interface AuditoriaLogPort {
  registrar(evento: AuditoriaLog): Promise<void>;
}
