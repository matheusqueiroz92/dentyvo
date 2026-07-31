"use client";

import { Menu } from "lucide-react";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import type { Papel } from "@/core/auth/domain/Papel";
import { tituloDaRota } from "@/lib/layout/nav";

import { NotificationsBell } from "./NotificationsBell";
import { UserMenu } from "./UserMenu";

type TopbarProps = {
  usuarioNome: string;
  usuarioPapel: Papel;
  onAbrirMenuMobile: () => void;
};

export function Topbar({
  usuarioNome,
  usuarioPapel,
  onAbrirMenuMobile,
}: TopbarProps) {
  const pathname = usePathname();
  const titulo = tituloDaRota(pathname);

  return (
    <header className="flex h-16 shrink-0 items-center gap-3 border-b border-border bg-card px-3 sm:px-4 lg:px-6">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="min-h-11 min-w-11 sm:hidden"
        onClick={onAbrirMenuMobile}
        aria-label="Abrir menu de navegação"
      >
        <Menu aria-hidden />
      </Button>

      <div className="min-w-0 flex-1">
        <nav aria-label="Contexto da página">
          <ol className="flex min-w-0 items-center gap-2 text-sm">
            <li className="truncate font-semibold text-foreground">{titulo}</li>
          </ol>
        </nav>
      </div>

      <div className="flex shrink-0 items-center gap-1 sm:gap-2">
        <NotificationsBell />
        <UserMenu nome={usuarioNome} papel={usuarioPapel} />
      </div>
    </header>
  );
}
