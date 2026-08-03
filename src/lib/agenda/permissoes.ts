import type { AcaoAgendamento } from "@/core/agendamento/domain/autorizacao";
import { pode } from "@/core/agendamento/domain/autorizacao";
import type { Papel } from "@/core/auth/domain/Papel";

import type { AgendaPermissoes } from "./types";

/** RBAC visual — espelha a matriz de domínio (spec 002). */
export function permissoesAgendaParaPapel(papel: Papel): AgendaPermissoes {
  return {
    marcar: pode(papel, "marcar_consulta"),
    remarcar: pode(papel, "remarcar_consulta"),
    cancelar: pode(papel, "cancelar_consulta"),
    confirmar: pode(papel, "confirmar_consulta"),
  };
}

export function podeAcaoAgenda(papel: Papel, acao: AcaoAgendamento): boolean {
  return pode(papel, acao);
}
