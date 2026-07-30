import { CalendarCheck, MessageSquareText, UserRoundPlus } from "lucide-react";

import { SectionReveal } from "@/components/marketing/SectionReveal";

const steps = [
  {
    title: "Cadastre a clínica",
    description:
      "Crie a conta, convide a equipe e configure o essencial em poucos minutos.",
    icon: UserRoundPlus,
  },
  {
    title: "Organize agenda e prontuário",
    description:
      "Centralize consultas, anamnese e evoluções sem planilha paralela.",
    icon: CalendarCheck,
  },
  {
    title: "Ative a secretária no WhatsApp",
    description:
      "Deixe o bot confirmar e responder pacientes mesmo fora do pico da recepção.",
    icon: MessageSquareText,
  },
] as const;

export function HowItWorksSection() {
  return (
    <SectionReveal
      id="como-funciona"
      aria-labelledby="como-funciona-heading"
      className="scroll-mt-20 border-b border-border"
      duration="component"
      yOffset={20}
    >
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-[11px] font-semibold tracking-wide text-primary uppercase">
            Como funciona
          </p>
          <h2
            id="como-funciona-heading"
            className="mt-3 text-2xl leading-8 font-bold tracking-tight sm:text-3xl"
          >
            Do cadastro ao atendimento no WhatsApp
          </h2>
          <p className="mt-4 text-base leading-7 text-muted-foreground">
            Três passos para colocar a operação da clínica no ar — sem curva
            íngreme de plataforma grande.
          </p>
        </div>

        <ol className="mt-10 grid gap-4 md:grid-cols-3">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <li
                key={step.title}
                className="rounded-[var(--radius-lg)] border border-border bg-card p-6 shadow-[var(--shadow-sm)]"
              >
                <div className="flex items-center gap-3">
                  <span className="numeric text-sm font-semibold text-muted-foreground">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div className="brand-gradient flex size-10 items-center justify-center rounded-[var(--radius-md)] text-primary-foreground">
                    <Icon className="size-5" aria-hidden strokeWidth={1.75} />
                  </div>
                </div>
                <h3 className="mt-4 text-lg font-semibold tracking-tight">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-[22px] text-muted-foreground">
                  {step.description}
                </p>
              </li>
            );
          })}
        </ol>
      </div>
    </SectionReveal>
  );
}
