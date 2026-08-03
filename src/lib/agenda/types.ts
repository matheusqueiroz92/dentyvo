import type { StatusAgendamento } from "@/core/agendamento/domain/StatusAgendamento";
import type { Papel } from "@/core/auth/domain/Papel";

export type AgendamentoAgendaDTO = {
  id: string;
  dataHoraInicioIso: string;
  dataHoraFimIso: string;
  pacienteId: string;
  pacienteNome: string;
  profissionalId: string;
  profissionalNome: string;
  procedimentoId: string;
  procedimentoNome: string;
  status: StatusAgendamento;
  origem: string;
  motivoCancelamento: string | null;
};

export type OpcaoSelect = {
  id: string;
  label: string;
};

export type AgendaModo = "dia" | "semana";

export type AgendaPermissoes = {
  marcar: boolean;
  remarcar: boolean;
  cancelar: boolean;
  confirmar: boolean;
};

export type AgendaContextoCliente = {
  clinicaId: string;
  usuarioId: string;
  papel: Papel;
  profissionalId: string;
  permissoes: AgendaPermissoes;
};
