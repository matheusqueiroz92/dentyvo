import Image from "next/image";
import Link from "next/link";

export function Footer() {
  const ano = new Intl.DateTimeFormat("pt-BR", { year: "numeric" }).format(
    new Date(),
  );

  return (
    <footer className="border-t border-border bg-[hsl(var(--brand-navy-950))] text-primary-foreground">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.8fr_1fr_1fr_1fr] lg:px-8">
        <Link href="/" className="space-y-3">
            <Image src="/dentyvo-logo-slogan-branca.png" alt="Dentyvo" width={542} height={150} />
        </Link>

        <div>
          <p className="text-[11px] font-semibold tracking-wide text-primary-foreground/50 uppercase">
            Links rápidos
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
              <a
                href="#faq"
                className="text-primary-foreground/80 hover:text-primary-foreground"
              >
                FAQ
              </a>
            </li>
            <li>
              <a
                href="#contato"
                className="text-primary-foreground/80 hover:text-primary-foreground"
              >
                Contato
              </a>
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

        <div>
          <p className="text-[11px] font-semibold tracking-wide text-primary-foreground/50 uppercase">
            Políticas
          </p>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <Link
                href="/privacidade"
                className="text-primary-foreground/80 hover:text-primary-foreground"
              >
                Política de privacidade
              </Link>
            </li>
            <li>
              <Link
                href="/termos"
                className="text-primary-foreground/80 hover:text-primary-foreground"
              >
                Termos de uso
              </Link>
            </li>
            <li>
              <Link
                href="/cookies"
                className="text-primary-foreground/80 hover:text-primary-foreground"
              >
                Política de cookies
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-primary-foreground/10">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-5 text-xs text-primary-foreground/55 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>© {ano} Dentyvo. Todos os direitos reservados.</p>
          <p>Desenvolvido por <Link href="https://www.azworkcenter.com.br" target="_blank" className="text-primary-foreground/80 hover:text-primary-foreground">AZ Work Center</Link>.</p>
        </div>
      </div>
    </footer>
  );
}
