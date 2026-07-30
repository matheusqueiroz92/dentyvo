import Link from "next/link";

import { ButtonLink } from "@/components/ui/button-link";

const navLinks = [
  { href: "#problema", label: "O problema" },
  { href: "#recursos", label: "Recursos" },
  { href: "#planos", label: "Planos" },
] as const;

export function MarketingHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="brand-gradient-text text-lg font-bold tracking-tight focus-visible:rounded-[var(--radius-sm)]"
        >
          Dentyvo
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
            href="#planos"
            variant="ghost"
            size="md"
            className="hidden min-h-11 sm:inline-flex"
          >
            Ver planos
          </ButtonLink>
          <ButtonLink href="/cadastro" variant="primary" size="md" className="min-h-11">
            Começar agora
          </ButtonLink>
        </div>
      </div>
    </header>
  );
}
