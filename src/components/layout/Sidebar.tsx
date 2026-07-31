"use client";

import { Building2, ChevronsLeft, ChevronsRight } from "lucide-react";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { isNavAtivo, NAV_GROUPS } from "@/lib/layout/nav";
import { cn } from "@/lib/utils";

import { SidebarNavItem } from "./SidebarNavItem";

type SidebarProps = {
  clinicaNome: string;
  clinicaLogoUrl?: string | null;
  recolhida: boolean;
  onToggleRecolhida: () => void;
  onNavigate?: () => void;
  className?: string;
  /** Esconde o botão de colapsar (ex.: drawer mobile). */
  ocultarToggle?: boolean;
};

export function Sidebar({
  clinicaNome,
  clinicaLogoUrl = null,
  recolhida,
  onToggleRecolhida,
  onNavigate,
  className,
  ocultarToggle = false,
}: SidebarProps) {
  const pathname = usePathname();
  const expandida = !recolhida;

  return (
    <aside
      data-collapsed={recolhida || undefined}
      className={cn(
        "flex h-full flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground",
        "transition-[width] duration-200 ease-[var(--ease-standard)]",
        expandida ? "w-[var(--sidebar-expanded)]" : "w-[var(--sidebar-collapsed)]",
        className,
      )}
    >
      <div
        className={cn(
          "flex h-16 shrink-0 items-center gap-3 border-b border-sidebar-border px-3",
          !expandida && "justify-center px-2",
        )}
      >
        <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
          {clinicaLogoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- URL externa (Blob)
            <img
              src={clinicaLogoUrl}
              alt=""
              className="size-full object-cover"
            />
          ) : (
            <Building2 className="size-5" aria-hidden />
          )}
        </div>
        {expandida ? (
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold leading-5">
              {clinicaNome}
            </p>
            <p className="truncate text-[12px] leading-[18px] text-muted-foreground">
              Clínica
            </p>
          </div>
        ) : (
          <span className="sr-only">{clinicaNome}</span>
        )}
      </div>

      <nav
        aria-label="Navegação principal"
        className="flex flex-1 flex-col gap-4 overflow-y-auto p-3"
      >
        {NAV_GROUPS.map((grupo) => (
          <div key={grupo.id} className="flex flex-col gap-1">
            {grupo.label && expandida ? (
              <p className="px-3 pb-1 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                {grupo.label}
              </p>
            ) : null}
            {grupo.label && !expandida ? (
              <Separator className="my-1 bg-sidebar-border" />
            ) : null}
            {grupo.items.map((item) => (
              <SidebarNavItem
                key={item.href}
                item={item}
                ativo={isNavAtivo(pathname, item.href)}
                recolhida={!expandida}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        ))}
      </nav>

      {!ocultarToggle ? (
        <div className="shrink-0 border-t border-sidebar-border p-3">
          <Button
            type="button"
            variant="ghost"
            size={expandida ? "md" : "icon"}
            className={cn(
              "min-h-11 w-full text-sidebar-foreground",
              !expandida && "mx-auto",
            )}
            onClick={onToggleRecolhida}
            aria-label={expandida ? "Recolher menu" : "Expandir menu"}
            aria-expanded={expandida}
          >
            {expandida ? (
              <>
                <ChevronsLeft aria-hidden />
                Recolher
              </>
            ) : (
              <ChevronsRight aria-hidden />
            )}
          </Button>
        </div>
      ) : null}
    </aside>
  );
}
