import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { resolverDestinoAuth } from "@/lib/auth-destino.server";
import { auth } from "@/lib/auth";
import { ArrowLeftIcon } from "lucide-react";

type PageAuthContainerProps = {
  children: ReactNode;
};

/**
 * Casca server-side das páginas de auth (DESIGN_SYSTEM §18).
 * Redireciona sessão existente; renderiza fundo + “Voltar ao Dentyvo”.
 */
export async function PageAuthContainer({ children }: PageAuthContainerProps) {
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
        <div className="mb-8 w-full max-w-md">
          <Link
            href="/"
            className="inline-flex min-h-11 items-center text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
          <ArrowLeftIcon className="h-4 w-4 mr-2" />Voltar
          </Link>
        </div>

        <div className="w-full max-w-md flex-1">{children}</div>
      </div>
    </div>
  );
}
