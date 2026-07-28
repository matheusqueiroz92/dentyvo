export const STATUS_AGENDAMENTO = [
  "pendente",
  "confirmado",
  "cancelado",
  "realizado",
  "faltou",
] as const;

export type StatusAgendamento = (typeof STATUS_AGENDAMENTO)[number];

/** Status que ocupam o slot do profissional (spec 002). */
export const STATUS_QUE_OCUPAM_SLOT: readonly StatusAgendamento[] = [
  "pendente",
  "confirmado",
];

export function ocupaSlot(status: StatusAgendamento): boolean {
  return (STATUS_QUE_OCUPAM_SLOT as readonly string[]).includes(status);
}

export const ORIGENS_AGENDAMENTO = [
  "painel",
  "whatsapp-bot",
  "link-publico",
] as const;

export type OrigemAgendamento = (typeof ORIGENS_AGENDAMENTO)[number];
