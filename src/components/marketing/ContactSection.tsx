import { CanaisSuporte } from "@/components/contato/CanaisSuporte";
import { ContatoForm } from "@/components/contato/ContatoForm";
import { SectionReveal } from "@/components/marketing/SectionReveal";
import { ButtonLink } from "@/components/ui/button-link";

/**
 * Contato da landing — antes do rodapé.
 * O envio reaproveita `ContatoForm` (mailto comercial), o mesmo da área logada.
 */
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
        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:gap-14">
          <div>
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
              Dúvidas sobre planos, trial, onboarding ou vendas? Envie uma
              mensagem ou fale direto pelos canais abaixo.
            </p>

            <CanaisSuporte className="mt-8" />

            <div className="mt-6">
              <ButtonLink
                href="/cadastro"
                variant="outline"
                size="lg"
                className="min-h-11"
              >
                Começar trial grátis
              </ButtonLink>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-6 shadow-(--shadow-sm) sm:p-8">
            <h3 className="text-lg font-semibold tracking-tight text-foreground">
              Envie uma mensagem
            </h3>
            <p className="mt-2 text-sm leading-5.5 text-muted-foreground">
              Contato geral ou comercial. Responderemos pelo e-mail informado.
            </p>

            <div className="mt-6">
              <ContatoForm variante="landing" />
            </div>
          </div>
        </div>
      </div>
    </SectionReveal>
  );
}
