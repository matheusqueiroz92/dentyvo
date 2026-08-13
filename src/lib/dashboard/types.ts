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
  /** Valor do catálogo (enum). A UI exibe o rótulo amigável, não este cru. */
  tipo: string;
  titulo: string;
  mensagem: string;
  criadaEmIso: string;
  linkAcao: string | null;
  planoNome: string | null;
  dataReferenciaIso: string | null;
  valorCentavos: number | null;
};

export type ResultadoBloco<T> =
  | { ok: true; data: T }
  | { ok: false; mensagem: string };
