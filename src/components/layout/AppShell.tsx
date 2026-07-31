"use client";

import { useState, type ReactNode } from "react";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import { useSidebarRecolhida } from "@/hooks/use-sidebar-recolhida";
import type { ContextoAppLayout } from "@/lib/layout/types";

import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

type AppShellProps = {
  contexto: ContextoAppLayout;
  children: ReactNode;
};

export function AppShell({ contexto, children }: AppShellProps) {
  const { recolhida, toggleRecolhida } = useSidebarRecolhida();
  const [mobileAberto, setMobileAberto] = useState(false);

  return (
    <div
      data-tema-clinica={contexto.clinicaTema}
      className="flex min-h-full bg-background text-foreground"
    >
      {/* Tablet+ : sidebar fixa recolhível; mobile (<640): drawer */}
      <div className="hidden sm:sticky sm:top-0 sm:flex sm:h-dvh sm:shrink-0">
        <Sidebar
          clinicaNome={contexto.clinicaNome}
          clinicaLogoUrl={contexto.clinicaLogoUrl}
          recolhida={recolhida}
          onToggleRecolhida={toggleRecolhida}
        />
      </div>

      <Sheet open={mobileAberto} onOpenChange={setMobileAberto}>
        <SheetContent side="left" className="w-[var(--sidebar-expanded)] p-0">
          <SheetTitle className="sr-only">Menu de navegação</SheetTitle>
          <SheetDescription className="sr-only">
            Navegação da clínica {contexto.clinicaNome}
          </SheetDescription>
          <Sidebar
            clinicaNome={contexto.clinicaNome}
            clinicaLogoUrl={contexto.clinicaLogoUrl}
            recolhida={false}
            onToggleRecolhida={() => undefined}
            onNavigate={() => setMobileAberto(false)}
            ocultarToggle
            className="w-full border-r-0"
          />
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          usuarioNome={contexto.usuario.nome}
          usuarioPapel={contexto.usuario.papel}
          onAbrirMenuMobile={() => setMobileAberto(true)}
        />
        <div className="flex-1 overflow-auto">
          <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
