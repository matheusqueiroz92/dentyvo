import { TIPOS_NOTIFICACAO } from "@/core/notificacao/domain/StatusEnvio";

const ROTULOS: Record<(typeof TIPOS_NOTIFICACAO)[number], string> = {
  aviso_aumento_preco: "Aviso de preço",
  lembrete_consulta: "Lembrete de consulta",
  trial_acabando: "Trial acabando",
  cobranca_vencida: "Cobrança vencida",
  convite_usuario: "Convite",
  novo_agendamento_publico_pendente: "Novo agendamento pelo link",
};

export function rotuloTipoNotificacao(tipo: string): string {
  if (tipo in ROTULOS) {
    return ROTULOS[tipo as (typeof TIPOS_NOTIFICACAO)[number]];
  }
  return "Notificação";
}
