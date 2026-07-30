import { SectionReveal } from "@/components/marketing/SectionReveal";
import { ButtonLink } from "@/components/ui/button-link";

export function ContactSection() {
  return (
    <SectionReveal
      id="contato"
      aria-labelledby="contato-heading"
      className="scroll-mt-20 border-b border-border"
      duration="component"
      yOffset={16}
    >
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="rounded-[var(--radius-xl)] border border-border bg-muted/40 px-6 py-10 sm:px-10 sm:py-12 lg:flex lg:items-center lg:justify-between lg:gap-10">
          <div className="max-w-xl">
            <p className="text-[11px] font-semibold tracking-wide text-primary uppercase">
              Contato
            </p>
            <h2
              id="contato-heading"
              className="mt-3 text-2xl leading-8 font-bold tracking-tight sm:text-3xl"
            >
              Fale com a Dentyvo
            </h2>
            <p className="mt-4 text-base leading-7 text-muted-foreground">
              Dúvidas sobre planos, trial ou onboarding? Escreva para{" "}
              <a
                href="mailto:contato@dentyvo.com.br"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                contato@dentyvo.com.br
              </a>{" "}
              ou comece o cadastro da clínica agora.
            </p>
          </div>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row lg:mt-0 lg:shrink-0">
            <ButtonLink
              href="/cadastro"
              variant="primary"
              size="lg"
              className="min-h-11"
            >
              Começar agora
            </ButtonLink>
            <ButtonLink
              href="mailto:contato@dentyvo.com.br"
              variant="outline"
              size="lg"
              className="min-h-11"
            >
              Enviar e-mail
            </ButtonLink>
          </div>
        </div>
      </div>
    </SectionReveal>
  );
}
