import type { LucideIcon } from "lucide-react";
import {
  CalendarDays,
  ClipboardPlus,
  LayoutDashboard,
  Settings,
  UsersRound,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Rota ainda sem feature — página placeholder "Em construção". */
  emConstrucao?: boolean;
};

export type NavGroup = {
  id: string;
  label?: string;
  items: NavItem[];
};

/**
 * Menu autenticado — só rotas existentes ou planejadas nesta fase.
 * Odontograma fica no prontuário do paciente (spec 004), não no menu topo.
 * Financeiro / Relatórios / Relacionamento: fora (overview futuro).
 *
 * Pendência futura (DESIGN_SYSTEM §9): busca global Ctrl/Cmd+K quando houver
 * entidades indexáveis suficientes — não implementar UI vazia agora.
 */
export const NAV_GROUPS: NavGroup[] = [
  {
    id: "principal",
    items: [
      {
        href: "/dashboard",
        label: "Visão geral",
        icon: LayoutDashboard,
      },
      {
        href: "/agenda",
        label: "Agenda",
        icon: CalendarDays,
      },
      {
        href: "/pacientes",
        label: "Pacientes",
        icon: UsersRound,
      },
    ],
  },
  {
    id: "clinico",
    label: "Clínico",
    items: [
      {
        href: "/prontuarios",
        label: "Prontuários",
        icon: ClipboardPlus,
      },
    ],
  },
  {
    id: "sistema",
    items: [
      {
        href: "/configuracoes",
        label: "Configurações",
        icon: Settings,
      },
    ],
  },
];

const TITULOS: Record<string, string> = {
  "/dashboard": "Visão geral",
  "/agenda": "Agenda",
  "/pacientes": "Pacientes",
  "/prontuarios": "Prontuários",
  "/configuracoes": "Configurações",
};

export function tituloDaRota(pathname: string): string {
  if (TITULOS[pathname]) return TITULOS[pathname];
  const match = Object.keys(TITULOS).find(
    (rota) => pathname === rota || pathname.startsWith(`${rota}/`),
  );
  return match ? TITULOS[match]! : "Dentyvo";
}

export function isNavAtivo(pathname: string, href: string): boolean {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}
