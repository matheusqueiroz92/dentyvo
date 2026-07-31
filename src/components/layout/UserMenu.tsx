"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Papel } from "@/core/auth/domain/Papel";
import { authClient } from "@/lib/auth-client";
import { iniciaisDoNome } from "@/lib/iniciais";

const ROTULO_PAPEL: Record<Papel, string> = {
  admin: "Administrador",
  dentista: "Dentista",
  recepcao: "Recepção",
};

type UserMenuProps = {
  nome: string;
  papel: Papel;
};

export function UserMenu({ nome, papel }: UserMenuProps) {
  const router = useRouter();
  const [saindo, setSaindo] = useState(false);

  async function sair() {
    setSaindo(true);
    try {
      await authClient.signOut();
      router.replace("/login");
      router.refresh();
    } catch {
      setSaindo(false);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          className="min-h-11 gap-2 px-2"
          aria-label={`Menu do usuário: ${nome}`}
        >
          <Avatar className="size-9">
            <AvatarFallback className="text-[12px]">
              {iniciaisDoNome(nome)}
            </AvatarFallback>
          </Avatar>
          <span className="hidden max-w-[10rem] truncate text-left text-sm font-medium md:inline">
            {nome}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <span className="block truncate">{nome}</span>
          <span className="mt-0.5 block text-[12px] font-normal text-muted-foreground">
            {ROTULO_PAPEL[papel]}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          disabled={saindo}
          onSelect={(event) => {
            event.preventDefault();
            void sair();
          }}
        >
          <LogOut aria-hidden />
          {saindo ? "Saindo…" : "Sair"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
