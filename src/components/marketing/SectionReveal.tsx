"use client";

import { motion, type HTMLMotionProps } from "motion/react";
import { useSyncExternalStore, type ReactNode } from "react";

import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/cn";
import {
  MOTION_DURATION_S,
  MOTION_EASE,
  MOTION_REVEAL_Y,
} from "@/lib/motion";

type DurationKind = keyof typeof MOTION_DURATION_S;

type SectionRevealProps = {
  as?: "section" | "div";
  duration?: DurationKind;
  /** Deslocamento vertical inicial em px (faixa 16–24). */
  yOffset?: number;
  className?: string;
  children: ReactNode;
} & Omit<
  HTMLMotionProps<"section">,
  "initial" | "animate" | "whileInView" | "transition" | "viewport"
>;

function subscribe() {
  return () => {};
}

/** `true` só no cliente; `false` no SSR (evita opacity:0 na primeira pintura). */
function useIsClient(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}

/**
 * Entrada ao rolar via `whileInView`: fade + leve translateY, uma vez.
 * SSR renderiza estático (visível); a animação só arma no cliente.
 * Com prefers-reduced-motion, permanece estático (DESIGN_SYSTEM §11 e §12).
 */
export function SectionReveal({
  as = "section",
  duration = "component",
  yOffset = MOTION_REVEAL_Y,
  className,
  children,
  ...rest
}: SectionRevealProps) {
  const shouldReduceMotion = useReducedMotion();
  const isClient = useIsClient();
  const MotionTag = as === "section" ? motion.section : motion.div;
  const StaticTag = as;

  if (shouldReduceMotion || !isClient) {
    return (
      <StaticTag
        className={cn(className)}
        {...(rest as React.HTMLAttributes<HTMLElement>)}
      >
        {children}
      </StaticTag>
    );
  }

  return (
    <MotionTag
      className={cn(className)}
      initial={{ opacity: 0, y: yOffset }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{
        duration: MOTION_DURATION_S[duration],
        ease: MOTION_EASE,
      }}
      {...rest}
    >
      {children}
    </MotionTag>
  );
}
