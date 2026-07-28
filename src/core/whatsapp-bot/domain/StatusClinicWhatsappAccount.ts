export const STATUS_CLINIC_WHATSAPP_ACCOUNT = [
  "pendente",
  "conectado",
  "desconectado",
] as const;

export type StatusClinicWhatsappAccount =
  (typeof STATUS_CLINIC_WHATSAPP_ACCOUNT)[number];

export function isStatusClinicWhatsappAccount(
  value: string,
): value is StatusClinicWhatsappAccount {
  return (STATUS_CLINIC_WHATSAPP_ACCOUNT as readonly string[]).includes(value);
}
