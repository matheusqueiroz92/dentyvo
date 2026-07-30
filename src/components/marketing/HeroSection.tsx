import { ArrowRight, Sparkles } from "lucide-react";

import { SectionReveal } from "@/components/marketing/SectionReveal";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";

export function HeroSection() {
  return (
    <SectionReveal
      aria-labelledby="hero-heading"
      className="relative overflow-hidden border-b border-border"
      duration="panel"
      yOffset={24}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(var(--brand-cyan-500)/0.14),transparent_55%),radial-gradient(ellipse_at_bottom_left,hsl(var(--brand-blue-600)/0.12),transparent_50%)]"
      />
      <div className="relative mx-auto grid max-w-6xl gap-12 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:px-8 lg:py-24">
        <div>
          <p className="brand-gradient-text text-sm font-semibold tracking-wide uppercase">
            Dentyvo
          </p>
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

        <div
          aria-hidden
          className="relative mx-auto w-full max-w-md rounded-[var(--radius-xl)] border border-border bg-card p-5 shadow-[var(--shadow-md)] lg:mx-0"
        >
          <div className="flex items-center gap-3 border-b border-border pb-4">
            <div className="brand-gradient flex size-10 items-center justify-center rounded-[var(--radius-md)] text-primary-foreground">
              <Sparkles className="size-5" strokeWidth={1.75} />
            </div>
            <div>
              <p className="text-sm font-semibold">Secretária virtual</p>
              <p className="text-xs text-muted-foreground">
                WhatsApp · online agora
              </p>
            </div>
            <Badge
              variant="success"
              className="ml-auto normal-case tracking-normal"
            >
              Ativa
            </Badge>
          </div>
          <div className="mt-4 space-y-3">
            <div className="rounded-[var(--radius-md)] bg-muted px-3 py-2.5 text-sm text-muted-foreground">
              Olá! Quero remarcar minha consulta de amanhã.
            </div>
            <div className="ml-6 rounded-[var(--radius-md)] bg-[hsl(var(--info-subtle))] px-3 py-2.5 text-sm text-[hsl(var(--info-subtle-foreground))]">
              Claro. Tenho horários às{" "}
              <span className="numeric font-medium">14:30</span> e{" "}
              <span className="numeric font-medium">16:00</span>. Qual prefere?
            </div>
            <div className="rounded-[var(--radius-md)] bg-muted px-3 py-2.5 text-sm text-muted-foreground">
              16:00, por favor.
            </div>
            <div className="ml-6 rounded-[var(--radius-md)] bg-[hsl(var(--success-subtle))] px-3 py-2.5 text-sm text-[hsl(var(--success-subtle-foreground))]">
              Pronto — consulta remarcada e confirmada na agenda.
            </div>
          </div>
        </div>
      </div>
    </SectionReveal>
  );
}
