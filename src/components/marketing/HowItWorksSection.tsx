"use client";

import {
  Building2,
  CalendarCheck,
  MessageCircle,
  UsersRound,
} from "lucide-react";
import { motion } from "motion/react";
import { useSyncExternalStore } from "react";

import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/cn";
import { MOTION_DURATION_S, MOTION_EASE, MOTION_REVEAL_Y } from "@/lib/motion";

const steps = [
  {
    title: "Cadastre sua clínica",
    description:
      "Crie sua conta em poucos minutos e comece o período de teste gratuito de 14 dias.",
    icon: Building2,
  },
  {
    title: "Configure sua equipe",
    description:
      "Convide dentistas e recepcionistas, defina disponibilidade de horários.",
    icon: UsersRound,
  },
  {
    title: "Conecte o WhatsApp",
    description:
      "Vincule o número da sua clínica com poucos cliques (Meta Embedded Signup) e ative a secretária virtual.",
    icon: MessageCircle,
  },
  {
    title: "Comece a atender",
    description:
      "Agende consultas, registre prontuários e deixe a Dentyvo cuidar do resto.",
    icon: CalendarCheck,
  },
] as const;

const STAGGER_S = 0.1;

function subscribe() {
  return () => {};
}

function useIsClient(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}

function StepCard({
  step,
  index,
}: {
  step: (typeof steps)[number];
  index: number;
}) {
  const Icon = step.icon;
  const number = String(index + 1).padStart(2, "0");

  return (
    <div className="relative flex flex-col md:items-center md:text-center">
      <div className="flex items-center gap-3 md:flex-col md:gap-4">
        <div className="relative z-10 flex size-12 shrink-0 items-center justify-center rounded-full border border-border bg-card shadow-[var(--shadow-sm)]">
          <div className="brand-gradient flex size-10 items-center justify-center rounded-full text-primary-foreground">
            <Icon className="size-5" aria-hidden strokeWidth={1.75} />
          </div>
        </div>
        <span className="numeric text-[11px] font-semibold tracking-wide text-muted-foreground uppercase md:mt-1">
          Passo {number}
        </span>
      </div>
      <h3 className="mt-4 text-lg font-semibold tracking-tight text-foreground">
        {step.title}
      </h3>
      <p className="mt-2 text-sm leading-[22px] text-muted-foreground">
        {step.description}
      </p>
    </div>
  );
}

export function HowItWorksSection() {
  const shouldReduceMotion = useReducedMotion();
  const isClient = useIsClient();
  const animate = isClient && !shouldReduceMotion;

  return (
    <section
      id="como-funciona"
      aria-labelledby="como-funciona-heading"
      className="scroll-mt-20 border-b border-border bg-card"
    >
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <motion.div
          className="mx-auto max-w-2xl text-center"
          initial={animate ? { opacity: 0, y: MOTION_REVEAL_Y } : false}
          whileInView={animate ? { opacity: 1, y: 0 } : undefined}
          viewport={{ once: true, amount: 0.3 }}
          transition={{
            duration: MOTION_DURATION_S.component,
            ease: MOTION_EASE,
          }}
        >
          <p className="text-[11px] font-semibold tracking-wide text-primary uppercase">
            Como funciona
          </p>
          <h2
            id="como-funciona-heading"
            className="mt-3 text-2xl leading-8 font-bold tracking-tight sm:text-3xl"
          >
            Do cadastro ao primeiro atendimento
          </h2>
          <p className="mt-4 text-base leading-7 text-muted-foreground">
            Quatro passos para colocar a clínica no ar — sem curva íngreme de
            plataforma grande.
          </p>
        </motion.div>

        <div className="relative mt-12 md:mt-14">
          {/* Conector horizontal (desktop) */}
          <div
            aria-hidden
            className="pointer-events-none absolute top-6 right-[12.5%] left-[12.5%] hidden h-px bg-border md:block"
          />

          <motion.ol
            className={cn(
              "grid gap-10",
              "md:grid-cols-4 md:gap-6 lg:gap-8",
            )}
            initial={animate ? "hidden" : false}
            whileInView={animate ? "visible" : undefined}
            viewport={{ once: true, amount: 0.2 }}
            variants={{
              hidden: {},
              visible: {
                transition: {
                  staggerChildren: STAGGER_S,
                  delayChildren: 0.05,
                },
              },
            }}
          >
            {steps.map((step, index) => (
              <motion.li
                key={step.title}
                className="relative"
                variants={
                  animate
                    ? {
                        hidden: { opacity: 0, y: MOTION_REVEAL_Y },
                        visible: {
                          opacity: 1,
                          y: 0,
                          transition: {
                            duration: MOTION_DURATION_S.component,
                            ease: MOTION_EASE,
                          },
                        },
                      }
                    : undefined
                }
              >
                {/* Conector vertical (mobile) */}
                {index < steps.length - 1 ? (
                  <div
                    aria-hidden
                    className="absolute top-12 bottom-[-2.5rem] left-6 w-px -translate-x-1/2 bg-border md:hidden"
                  />
                ) : null}
                <StepCard step={step} index={index} />
              </motion.li>
            ))}
          </motion.ol>
        </div>
      </div>
    </section>
  );
}
