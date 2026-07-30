"use client";

import { Sparkles } from "lucide-react";
import { motion } from "motion/react";
import {
  useSyncExternalStore,
  type ReactNode,
} from "react";

import { Badge } from "@/components/ui/badge";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/cn";
import { MOTION_DURATION_S, MOTION_EASE } from "@/lib/motion";

/**
 * Slide do visual do hero. Estrutura pronta para carrossel futuro
 * (dashboard, agenda, notificações) sem mudar o contrato do HeroSection.
 */
export type HeroVisualSlide = {
  id: string;
  label: string;
  content: ReactNode;
};

type HeroVisualProps = {
  className?: string;
  /** Índice ativo — hoje só o slide 0; carrossel virá depois. */
  activeIndex?: number;
};

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

function WhatsAppConversationScreen() {
  return (
    <div className="flex h-full flex-col bg-[hsl(var(--muted))]">
      <div className="flex items-center gap-2.5 border-b border-border/80 bg-card px-3 py-2.5">
        <div className="brand-gradient flex size-8 shrink-0 items-center justify-center rounded-full text-primary-foreground">
          <Sparkles className="size-3.5" strokeWidth={1.75} aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-semibold leading-4 text-foreground">
            Secretária virtual
          </p>
          <p className="truncate text-[11px] leading-4 text-muted-foreground">
            WhatsApp · online agora
          </p>
        </div>
        <Badge
          variant="success"
          className="shrink-0 normal-case tracking-normal"
        >
          Ativa
        </Badge>
      </div>

      <div className="flex flex-1 flex-col gap-2.5 overflow-hidden px-3 py-3">
        <div className="max-w-[88%] rounded-2xl rounded-tl-sm bg-card px-3 py-2 text-[12px] leading-[18px] text-muted-foreground shadow-[var(--shadow-sm)]">
          Olá! Quero remarcar minha consulta de amanhã.
        </div>
        <div className="ml-auto max-w-[88%] rounded-2xl rounded-tr-sm bg-[hsl(var(--info-subtle))] px-3 py-2 text-[12px] leading-[18px] text-[hsl(var(--info-subtle-foreground))] shadow-[var(--shadow-sm)]">
          Claro. Tenho horários às{" "}
          <span className="numeric font-medium">14:30</span> e{" "}
          <span className="numeric font-medium">16:00</span>. Qual prefere?
        </div>
        <div className="max-w-[88%] rounded-2xl rounded-tl-sm bg-card px-3 py-2 text-[12px] leading-[18px] text-muted-foreground shadow-[var(--shadow-sm)]">
          16:00, por favor.
        </div>
        <div className="ml-auto max-w-[88%] rounded-2xl rounded-tr-sm bg-[hsl(var(--success-subtle))] px-3 py-2 text-[12px] leading-[18px] text-[hsl(var(--success-subtle-foreground))] shadow-[var(--shadow-sm)]">
          Pronto — consulta remarcada e confirmada na agenda.
        </div>
      </div>
    </div>
  );
}

function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div
      className={cn(
        "relative mx-auto w-[min(100%,280px)] sm:w-[300px]",
        "rounded-[2rem] border border-[hsl(var(--brand-navy-950)/0.35)]",
        "bg-[hsl(var(--brand-navy-950))] p-[10px]",
        "shadow-[0_28px_56px_-18px_hsl(var(--brand-navy-950)/0.28),0_12px_24px_-16px_hsl(var(--brand-navy-950)/0.18)]",
      )}
    >
      <div
        aria-hidden
        className="absolute top-[10px] left-1/2 z-10 h-5 w-24 -translate-x-1/2 rounded-full bg-[hsl(var(--brand-navy-950))]"
      />
      <div className="relative aspect-[9/19] overflow-hidden rounded-[1.35rem] bg-card">
        {children}
      </div>
    </div>
  );
}

function PhoneStage({
  children,
  shouldReduceMotion,
  isClient,
}: {
  children: ReactNode;
  shouldReduceMotion: boolean | null;
  isClient: boolean;
}) {
  const reduce = Boolean(shouldReduceMotion);

  if (!isClient || reduce) {
    return (
      <div className="relative origin-center rotate-[5deg]">{children}</div>
    );
  }

  return (
    <motion.div
      className="relative origin-center"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: MOTION_DURATION_S.panel, ease: MOTION_EASE }}
    >
      <motion.div
        className="will-change-transform"
        style={{ rotate: 5 }}
        animate={{ y: [0, -6, 0] }}
        transition={{
          duration: 5.5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: MOTION_DURATION_S.panel,
        }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

/**
 * Visual do hero isolado — hoje um mockup WhatsApp; amanhã carrossel
 * de telas reais (agenda, painel, etc.) sem reescrever o HeroSection.
 */
export function HeroVisual({ className, activeIndex = 0 }: HeroVisualProps) {
  const shouldReduceMotion = useReducedMotion();
  const isClient = useIsClient();

  const slides: HeroVisualSlide[] = [
    {
      id: "whatsapp-secretaria",
      label: "Secretária virtual no WhatsApp",
      content: <WhatsAppConversationScreen />,
    },
    // Futuro: slides do dashboard/agenda quando as telas existirem.
  ];

  const activeSlide = slides[Math.min(activeIndex, slides.length - 1)]!;

  return (
    <div
      className={cn(
        "relative flex min-h-[420px] items-center justify-center py-4 lg:min-h-[520px] lg:justify-end",
        className,
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-[8%] rounded-full bg-[radial-gradient(ellipse_at_center,hsl(var(--brand-cyan-500)/0.18),transparent_68%)] blur-2xl"
      />

      <div aria-hidden>
        <PhoneStage
          shouldReduceMotion={shouldReduceMotion}
          isClient={isClient}
        >
          <PhoneFrame>{activeSlide.content}</PhoneFrame>
        </PhoneStage>
      </div>
      <p className="sr-only">{activeSlide.label}</p>
    </div>
  );
}
