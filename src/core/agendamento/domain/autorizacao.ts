import type { Papel } from "@/core/auth/domain/Papel";
import { criarVerificadorAutorizacao } from "@/core/shared/autorizacao";

/** Ações da matriz de permissões do módulo agendamento (spec 002). */
export const ACOES_AGENDAMENTO = [
  "definir_disponibilidade",
  "listar_horarios_disponiveis",
  "listar_agendamentos_do_periodo",
  "marcar_consulta",
  "remarcar_consulta",
  "cancelar_consulta",
  "confirmar_consulta",
  "criar_procedimento",
  "buscar_procedimento",
  "listar_procedimentos",
  "configurar_menu_publico_procedimentos",
] as const;

export type AcaoAgendamento = (typeof ACOES_AGENDAMENTO)[number];

const MATRIZ: Record<AcaoAgendamento, readonly Papel[]> = {
  definir_disponibilidade: ["admin", "dentista"],
  listar_horarios_disponiveis: ["admin", "dentista", "recepcao"],
  listar_agendamentos_do_periodo: ["admin", "dentista", "recepcao"],
  marcar_consulta: ["admin", "dentista", "recepcao"],
  remarcar_consulta: ["admin", "dentista", "recepcao"],
  cancelar_consulta: ["admin", "dentista", "recepcao"],
  confirmar_consulta: ["admin", "dentista", "recepcao"],
  criar_procedimento: ["admin", "dentista", "recepcao"],
  buscar_procedimento: ["admin", "dentista", "recepcao"],
  listar_procedimentos: ["admin", "dentista", "recepcao"],
  configurar_menu_publico_procedimentos: ["admin"],
};

export const { pode, assertPode } = criarVerificadorAutorizacao(MATRIZ);
