"use client";

import Link from "next/link";

import { cn } from "@/lib/utils";
import type { NavItem } from "@/lib/layout/nav";

type SidebarNavItemProps = {
  item: NavItem;
  ativo: boolean;
  recolhida: boolean;
  onNavigate?: () => void;
};

export function SidebarNavItem({
  item,
  ativo,
  recolhida,
  onNavigate,
}: SidebarNavItemProps) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      title={recolhida ? item.label : undefined}
      aria-current={ativo ? "page" : undefined}
      onClick={onNavigate}
      className={cn(
        "flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors outline-none",
        "focus-visible:ring-3 focus-visible:ring-sidebar-ring/50",
        ativo
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "text-sidebar-foreground/80 hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground",
        recolhida && "justify-center px-0",
      )}
    >
      <Icon className="size-5 shrink-0" strokeWidth={1.75} aria-hidden />
      {!recolhida ? <span className="truncate">{item.label}</span> : null}
      {!recolhida && item.emConstrucao ? (
        <span className="sr-only">(em construção)</span>
      ) : null}
    </Link>
  );
}
