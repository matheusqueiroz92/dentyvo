import { ArrowRight } from "lucide-react";

import { HeroVisual } from "@/components/marketing/HeroVisual";
import { SectionReveal } from "@/components/marketing/SectionReveal";
import { ButtonLink } from "@/components/ui/button-link";

export function HeroSection() {
  return (
    <SectionReveal
      aria-labelledby="hero-heading"
      className="relative overflow-x-clip border-b border-border bg-[hsl(var(--muted)/0.55)]"
      duration="panel"
      yOffset={24}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(var(--brand-cyan-500)/0.16),transparent_52%),radial-gradient(ellipse_at_bottom_left,hsl(var(--brand-blue-600)/0.12),transparent_48%),linear-gradient(180deg,hsl(var(--card)/0.35)_0%,transparent_55%)]"
      />
      <div className="relative mx-auto grid max-w-6xl gap-12 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-10 lg:px-8 lg:py-24">
        <div>
          <h1
            id="hero-heading"
            className="mt-4 max-w-2xl text-3xl leading-tight font-bold tracking-tight text-foreground sm:text-4xl lg:text-[2.75rem] lg:leading-[1.15]"
          >
            Sua clínica nunca mais deixa um paciente sem resposta.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
            Agendamento, prontuário e uma secretária virtual no WhatsApp que
            atende por você — mesmo quando não há ninguém na recepção.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <ButtonLink
              href="/cadastro"
              variant="primary"
              size="lg"
              className="min-h-11"
            >
              Começar agora
              <ArrowRight aria-hidden strokeWidth={2} />
            </ButtonLink>
            <ButtonLink
              href="#planos"
              variant="outline"
              size="lg"
              className="min-h-11"
            >
              Ver planos
            </ButtonLink>
          </div>
        </div>

        <HeroVisual />
      </div>
    </SectionReveal>
  );
}
