"use client";

import "lenis/dist/lenis.css";

import { ReactLenis } from "lenis/react";
import type { ReactNode } from "react";

import { useReducedMotion } from "@/hooks/use-reduced-motion";

/** Offset para o header sticky (64px) + folga de leitura. */
const ANCHOR_OFFSET_PX = -80;

type SmoothScrollProviderProps = {
  children: ReactNode;
};

/**
 * Smooth scroll (Lenis) para o route group de marketing.
 * Com `prefers-reduced-motion`, devolve o scroll nativo sem Lenis.
 * `anchors` faz cliques em #seção rolarem suavemente até o alvo.
 */
export function SmoothScrollProvider({ children }: SmoothScrollProviderProps) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <>{children}</>;
  }

  return (
    <>
      <ReactLenis
        root
        options={{
          autoRaf: true,
          anchors: {
            offset: ANCHOR_OFFSET_PX,
          },
        }}
      />
      {children}
    </>
  );
}
