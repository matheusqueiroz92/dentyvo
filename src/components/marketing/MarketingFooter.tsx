import Link from "next/link";

export function MarketingFooter() {
  const ano = new Intl.DateTimeFormat("pt-BR", { year: "numeric" }).format(
    new Date(),
  );

  return (
    <footer className="border-t border-border bg-[hsl(var(--brand-navy-950))] text-primary-foreground">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr] lg:px-8">
        <div className="space-y-3">
          <p className="brand-gradient-text text-xl font-bold tracking-tight">
            Dentyvo
          </p>
          <p className="max-w-sm text-sm leading-[22px] text-primary-foreground/70">
            O centro operacional da clínica odontológica: agenda, prontuário e
            relacionamento em uma experiência integrada.
          </p>
        </div>

        <div>
          <p className="text-[11px] font-semibold tracking-wide text-primary-foreground/50 uppercase">
            Produto
          </p>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <a
                href="#recursos"
                className="text-primary-foreground/80 hover:text-primary-foreground"
              >
                Recursos
              </a>
            </li>
            <li>
              <a
                href="#planos"
                className="text-primary-foreground/80 hover:text-primary-foreground"
              >
                Planos
              </a>
            </li>
            <li>
              <Link
                href="/cadastro"
                className="text-primary-foreground/80 hover:text-primary-foreground"
              >
                Cadastro de clínica
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <p className="text-[11px] font-semibold tracking-wide text-primary-foreground/50 uppercase">
            Contato
          </p>
          <ul className="mt-3 space-y-2 text-sm text-primary-foreground/80">
            <li>
              <a
                href="mailto:contato@dentyvo.com.br"
                className="hover:text-primary-foreground"
              >
                contato@dentyvo.com.br
              </a>
            </li>
            <li>Brasil</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-primary-foreground/10">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-5 text-xs text-primary-foreground/55 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>© {ano} Dentyvo. Todos os direitos reservados.</p>
          <p>Feita para o tamanho real da sua clínica.</p>
        </div>
      </div>
    </footer>
  );
}
