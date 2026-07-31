import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { ArrowLeftIcon } from "lucide-react";

import { resolverDestinoAuth } from "@/lib/auth-destino.server";
import { auth } from "@/lib/auth";
import { cn } from "@/lib/utils";

type PageAuthContainerProps = {
  children: ReactNode;
  /** Largura do conteúdo — `wide` para cadastro com seleção de planos. */
  width?: "md" | "wide";
};

/**
 * Casca server-side das páginas de auth (DESIGN_SYSTEM §18).
 * Redireciona sessão existente; renderiza fundo + “Voltar ao Dentyvo”.
 */
export async function PageAuthContainer({
  children,
  width = "md",
}: PageAuthContainerProps) {
  const sessao = await auth.api.getSession({ headers: await headers() });
  if (sessao?.user) {
    const destino = await resolverDestinoAuth({
      usuarioId: sessao.user.id,
      email: sessao.user.email,
    });
    if (destino) {
      redirect(destino);
    }
  }

  return (
    <div className="flex min-h-full flex-col bg-background">
      <div className="flex flex-1 flex-col items-center px-4 py-8 sm:py-12">
        <div
          className={cn(
            "mb-8 w-full",
            width === "wide" ? "max-w-5xl" : "max-w-md",
          )}
        >
          <Link
            href="/"
            className="inline-flex min-h-11 items-center text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            Voltar
          </Link>
        </div>

        <div
          className={cn(
            "w-full flex-1",
            width === "wide" ? "max-w-5xl" : "max-w-md",
          )}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
