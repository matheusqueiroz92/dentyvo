import type { MotivoAcesso } from "@/core/assinatura/domain/ResultadoAcesso";
import type { StatusAgendamento } from "@/core/agendamento/domain/StatusAgendamento";

export type AgendamentoDashboardDTO = {
  id: string;
  dataHoraInicioIso: string;
  pacienteNome: string;
  profissionalNome: string;
  status: StatusAgendamento;
};

export type StatusAssinaturaDashboardDTO = {
  permitido: boolean;
  motivo: MotivoAcesso;
  ateDataIso: string | null;
};

export type NotificacaoDashboardDTO = {
  id: string;
  titulo: string;
  mensagem: string;
  criadaEmIso: string;
  linkAcao: string | null;
};

export type ResultadoBloco<T> =
  | { ok: true; data: T }
  | { ok: false; mensagem: string };
