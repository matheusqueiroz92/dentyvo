"use client";

import { ChevronDown } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import * as React from "react";

import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/cn";
import { MOTION_DURATION_S, MOTION_EASE } from "@/lib/motion";

type AccordionType = "single";

type AccordionContextValue = {
  type: AccordionType;
  value: string | undefined;
  collapsible: boolean;
  setValue: (next: string | undefined) => void;
};

const AccordionContext = React.createContext<AccordionContextValue | null>(
  null,
);

type AccordionItemContextValue = {
  value: string;
  open: boolean;
  triggerId: string;
  contentId: string;
};

const AccordionItemContext =
  React.createContext<AccordionItemContextValue | null>(null);

function useAccordion() {
  const ctx = React.useContext(AccordionContext);
  if (!ctx) {
    throw new Error("Accordion components must be used within <Accordion>.");
  }
  return ctx;
}

function useAccordionItem() {
  const ctx = React.useContext(AccordionItemContext);
  if (!ctx) {
    throw new Error(
      "AccordionTrigger/Content must be used within <AccordionItem>.",
    );
  }
  return ctx;
}

export type AccordionProps = {
  type?: AccordionType;
  /** Se true, o item aberto pode ser fechado ao clicar de novo. */
  collapsible?: boolean;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string | undefined) => void;
  className?: string;
  children: React.ReactNode;
};

export function Accordion({
  type = "single",
  collapsible = true,
  value: valueProp,
  defaultValue,
  onValueChange,
  className,
  children,
}: AccordionProps) {
  const [uncontrolled, setUncontrolled] = React.useState<string | undefined>(
    defaultValue,
  );
  const isControlled = valueProp !== undefined;
  const value = isControlled ? valueProp : uncontrolled;

  const setValue = React.useCallback(
    (next: string | undefined) => {
      if (!isControlled) {
        setUncontrolled(next);
      }
      onValueChange?.(next);
    },
    [isControlled, onValueChange],
  );

  return (
    <AccordionContext.Provider value={{ type, value, collapsible, setValue }}>
      <div className={cn("flex flex-col", className)} data-slot="accordion">
        {children}
      </div>
    </AccordionContext.Provider>
  );
}

export type AccordionItemProps = {
  value: string;
  className?: string;
  children: React.ReactNode;
};

export function AccordionItem({
  value,
  className,
  children,
}: AccordionItemProps) {
  const accordion = useAccordion();
  const open = accordion.value === value;
  const reactId = React.useId();
  const triggerId = `${reactId}-trigger`;
  const contentId = `${reactId}-content`;

  return (
    <AccordionItemContext.Provider
      value={{ value, open, triggerId, contentId }}
    >
      <div
        data-slot="accordion-item"
        data-state={open ? "open" : "closed"}
        className={cn(
          "border-b border-border last:border-b-0",
          className,
        )}
      >
        {children}
      </div>
    </AccordionItemContext.Provider>
  );
}

export type AccordionTriggerProps =
  React.ButtonHTMLAttributes<HTMLButtonElement>;

export function AccordionTrigger({
  className,
  children,
  ...props
}: AccordionTriggerProps) {
  const accordion = useAccordion();
  const item = useAccordionItem();

  function handleClick() {
    if (item.open) {
      if (accordion.collapsible) {
        accordion.setValue(undefined);
      }
      return;
    }
    accordion.setValue(item.value);
  }

  return (
    <h3 className="m-0">
      <button
        type="button"
        id={item.triggerId}
        aria-expanded={item.open}
        aria-controls={item.contentId}
        data-slot="accordion-trigger"
        data-state={item.open ? "open" : "closed"}
        className={cn(
          "flex w-full items-center justify-between gap-3 py-4 text-left text-sm font-semibold leading-6 text-foreground",
          "min-h-11 outline-none transition-colors duration-[var(--duration-fast)] ease-[var(--ease-standard)]",
          "hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
          className,
        )}
        onClick={handleClick}
        {...props}
      >
        <span className="flex-1">{children}</span>
        <ChevronDown
          aria-hidden
          className={cn(
            "size-[18px] shrink-0 text-muted-foreground transition-transform duration-[var(--duration-base)] ease-[var(--ease-standard)]",
            item.open && "rotate-180",
          )}
        />
      </button>
    </h3>
  );
}

export type AccordionContentProps = {
  className?: string;
  children: React.ReactNode;
};

export function AccordionContent({
  className,
  children,
}: AccordionContentProps) {
  const item = useAccordionItem();
  const reduceMotion = useReducedMotion();
  const duration = reduceMotion ? 0 : MOTION_DURATION_S.component;

  return (
    <AnimatePresence initial={false}>
      {item.open ? (
        <motion.div
          key="content"
          id={item.contentId}
          role="region"
          aria-labelledby={item.triggerId}
          data-slot="accordion-content"
          data-state="open"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration, ease: MOTION_EASE }}
          className="overflow-hidden"
        >
          <div
            className={cn(
              "pb-4 text-sm leading-[22px] text-muted-foreground",
              className,
            )}
          >
            {children}
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
