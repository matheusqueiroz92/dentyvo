import Link from "next/link";

import { ButtonLink } from "@/components/ui/button-link";
import Image from "next/image";

const navLinks = [
  { href: "#recursos", label: "Recursos" },
  { href: "#como-funciona", label: "Como funciona" },
  { href: "#planos", label: "Planos" },
  { href: "#faq", label: "FAQ" },
  { href: "#contato", label: "Contato" },
] as const;

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="brand-gradient-text text-lg font-bold tracking-tight focus-visible:rounded-sm"
        >
          <Image src="/dentyvo-logo-nome.png" alt="Dentyvo" width={150} height={150} />
        </Link>

        <nav
          aria-label="Seções da página"
          className="hidden items-center gap-6 md:flex"
        >
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ButtonLink
            href="/login"
            size="md"
            className="hidden min-h-11 rounded-md border border-border bg-background text-muted-foreground hover:text-foreground sm:inline-flex"
          >
            Entrar
          </ButtonLink>
          <ButtonLink
            href="/cadastro"
            variant="primary"
            size="md"
            className="min-h-11 text-white hover:bg-brand-cyan-600/90"
          >
            Começar agora
          </ButtonLink>
        </div>
      </div>
    </header>
  );
}
