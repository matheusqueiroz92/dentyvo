import Link from "next/link";
import type { ReactNode } from "react";

import { AvisoDocumentoNaoRevisado } from "@/components/legal/AvisoDocumentoNaoRevisado";

type LegalDocumentLayoutProps = {
  title: string;
  children: ReactNode;
  updatedLabel?: string;
};

export function LegalDocumentLayout({
  title,
  children,
  updatedLabel = "Modelo estrutural — pendente de revisão jurídica",
}: LegalDocumentLayoutProps) {
  return (
    <main className="mx-auto max-w-2xl px-4 py-12 sm:py-16">
      <p className="font-sans text-xl font-bold text-foreground">Dentyvo</p>
      <h1 className="mt-6 text-2xl font-semibold tracking-tight text-foreground">
        {title}
      </h1>
      <p className="mt-2 text-xs text-muted-foreground">{updatedLabel}</p>

      <div className="mt-6">
        <AvisoDocumentoNaoRevisado />
      </div>

      <div className="prose-legal space-y-6 text-sm leading-[22px] text-foreground">
        {children}
      </div>

      <nav
        className="mt-12 flex flex-wrap gap-x-4 gap-y-2 border-t border-border pt-6 text-sm"
        aria-label="Documentos relacionados"
      >
        <Link
          href="/termos"
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          Termos de uso
        </Link>
        <Link
          href="/privacidade"
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          Privacidade
        </Link>
        <Link
          href="/cookies"
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          Cookies
        </Link>
        <Link
          href="/"
          className="inline-flex min-h-11 items-center font-medium text-primary underline-offset-4 hover:underline"
        >
          Voltar ao início
        </Link>
      </nav>
    </main>
  );
}

export function LegalSection({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-8">
      <h2
        id={`${id}-title`}
        className="text-base font-semibold tracking-tight text-foreground"
      >
        {title}
      </h2>
      <div className="mt-2 space-y-3 text-muted-foreground [&_strong]:font-medium [&_strong]:text-foreground [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5">
        {children}
      </div>
    </section>
  );
}
