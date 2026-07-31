export const dentyvoTokens = {
  brand: {
    navy950: "#07143F",
    navy900: "#0A1643",
    blue600: "#0863C5",
    blue500: "#108ECB",
    cyan500: "#0EB6C6",
    teal400: "#18C7B8",
    gradient:
      "linear-gradient(135deg, #0863C5 0%, #108ECB 48%, #18C7B8 100%)",
  },
  radius: {
    xs: 4,
    sm: 6,
    md: 8,
    lg: 12,
    xl: 16,
    full: 9999,
  },
  spacing: [0, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80],
  layout: {
    sidebarExpanded: 256,
    sidebarCollapsed: 72,
    topbarHeight: 64,
    contentMaxWidth: 1600,
  },
  breakpoints: {
    mobile: 640,
    tablet: 1024,
    desktop: 1440,
  },
  appointmentStatus: {
    scheduled: "scheduled",
    pending: "pending",
    confirmed: "confirmed",
    inProgress: "in-progress",
    completed: "completed",
    cancelled: "cancelled",
    noShow: "no-show",
  },
} as const;

export type AppointmentStatus =
  (typeof dentyvoTokens.appointmentStatus)[keyof typeof dentyvoTokens.appointmentStatus];

/** Normaliza NBSP do ICU para espaço comum — evita mismatch SSR/cliente. */
function normalizarEspacosIntl(value: string): string {
  return value.replace(/[\u00a0\u202f]/g, " ");
}

export const formatBRL = (value: number): string =>
  normalizarEspacosIntl(
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value),
  );

export const formatDateBR = (
  value: Date | string | number,
  options: Intl.DateTimeFormatOptions = { dateStyle: "short" },
): string =>
  new Intl.DateTimeFormat("pt-BR", options).format(new Date(value));
