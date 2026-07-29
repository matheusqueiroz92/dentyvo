export const TIPOS_NOTIFICACAO = [
  "aviso_aumento_preco",
  "lembrete_consulta",
  "trial_acabando",
  "cobranca_vencida",
  "convite_usuario",
] as const;

export type TipoNotificacao = (typeof TIPOS_NOTIFICACAO)[number];

export const CANAIS_NOTIFICACAO = ["email", "in_app"] as const;
export type CanalNotificacao = (typeof CANAIS_NOTIFICACAO)[number];

export const STATUS_ENVIO = ["pendente", "enviada", "falhou"] as const;
export type StatusEnvio = (typeof STATUS_ENVIO)[number];

/**
 * Transições válidas de `statusEnvio` (spec 011).
 * MVP: sem retry — `falhou` e `enviada` são terminais.
 */
export const TRANSICOES_STATUS_ENVIO: Record<
  StatusEnvio,
  readonly StatusEnvio[]
> = {
  pendente: ["enviada", "falhou"],
  enviada: [],
  falhou: [],
};

export function podeTransicionarStatusEnvio(
  de: StatusEnvio,
  para: StatusEnvio,
): boolean {
  return TRANSICOES_STATUS_ENVIO[de].includes(para);
}
