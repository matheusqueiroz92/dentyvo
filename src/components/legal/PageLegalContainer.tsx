import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeftIcon } from "lucide-react";

import { AvisoDocumentoNaoRevisado } from "@/components/legal/AvisoDocumentoNaoRevisado";

type PageLegalContainerProps = {
  title: string;
  children: ReactNode;
  updatedLabel?: string;
};

/**
 * Casca das páginas legais (`/termos`, `/privacidade`, `/cookies`).
 * Espelha a estrutura do `PageAuthContainer`: voltar, fundo, conteúdo e
 * rodapé padronizado — o texto do documento vem em `{children}`.
 */
export function PageLegalContainer({
  title,
  children,
  updatedLabel = "Modelo estrutural — pendente de revisão jurídica",
}: PageLegalContainerProps) {
  const ano = new Intl.DateTimeFormat("pt-BR", { year: "numeric" }).format(
    new Date(),
  );

  return (
    <div className="flex min-h-full flex-col bg-background">
      <div className="flex flex-1 flex-col items-center px-4 py-8 sm:py-12">
        <div className="mb-8 w-full max-w-2xl">
          <Link
            href="/"
            className="inline-flex min-h-11 items-center text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeftIcon className="mr-2 h-4 w-4" aria-hidden />
            Voltar
          </Link>
        </div>

        <div className="w-full max-w-2xl flex-1">
          <header className="flex flex-col items-start gap-6">
            <Link href="/" className="inline-block">
              <Image
                src="/dentyvo-logo-nome.png"
                alt="Dentyvo"
                width={1626}
                height={448}
                className="w-[160px] sm:w-[200px]"
                style={{ height: "auto" }}
                priority
              />
            </Link>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                {title}
              </h1>
              <p className="mt-2 text-xs text-muted-foreground">{updatedLabel}</p>
            </div>
          </header>

          <div className="mt-6">
            <AvisoDocumentoNaoRevisado />
          </div>

          <div className="prose-legal space-y-6 text-sm leading-[22px] text-foreground">
            {children}
          </div>
        </div>
      </div>

      <footer className="border-t border-border bg-[hsl(var(--brand-navy-950))] text-primary-foreground">
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-10 sm:px-6">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <Link
              href="/"
              className="inline-block shrink-0"
              aria-label="Página inicial Dentyvo"
            >
              <Image
                src="/dentyvo-logo-slogan-branca.png"
                alt=""
                width={542}
                height={150}
                className="w-[160px]"
                style={{ height: "auto" }}
              />
            </Link>

            <nav aria-label="Documentos legais">
              <p className="text-[11px] font-semibold tracking-wide text-primary-foreground/50 uppercase">
                Políticas
              </p>
              <ul className="mt-3 space-y-2 text-sm">
                <li>
                  <Link
                    href="/termos"
                    className="inline-flex min-h-11 items-center text-primary-foreground/80 transition-colors hover:text-primary-foreground"
                  >
                    Termos de uso
                  </Link>
                </li>
                <li>
                  <Link
                    href="/privacidade"
                    className="inline-flex min-h-11 items-center text-primary-foreground/80 transition-colors hover:text-primary-foreground"
                  >
                    Política de privacidade
                  </Link>
                </li>
                <li>
                  <Link
                    href="/cookies"
                    className="inline-flex min-h-11 items-center text-primary-foreground/80 transition-colors hover:text-primary-foreground"
                  >
                    Política de cookies
                  </Link>
                </li>
              </ul>
            </nav>
          </div>

          <div className="flex flex-col gap-2 border-t border-primary-foreground/10 pt-5 text-xs text-primary-foreground/55 sm:flex-row sm:items-center sm:justify-between">
            <p>© {ano} Dentyvo. Todos os direitos reservados.</p>
            <p>
              <Link
                href="/"
                className="text-primary-foreground/80 transition-colors hover:text-primary-foreground"
              >
                Voltar ao início
              </Link>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
