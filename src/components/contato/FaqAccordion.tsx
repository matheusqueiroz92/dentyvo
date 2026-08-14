import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { FaqItem } from "@/lib/ajuda/faq";
import { cn } from "@/lib/utils";

type FaqAccordionProps = {
  items: readonly FaqItem[];
  idPrefix?: string;
  className?: string;
};

export function FaqAccordion({
  items,
  idPrefix = "faq",
  className,
}: FaqAccordionProps) {
  return (
    <Accordion
      type="single"
      collapsible
      className={cn(
        "rounded-lg border border-border bg-background px-4 shadow-(--shadow-sm) sm:px-5",
        className,
      )}
    >
      {items.map((item, index) => (
        <AccordionItem key={item.pergunta} value={`${idPrefix}-${index}`}>
          <AccordionTrigger>{item.pergunta}</AccordionTrigger>
          <AccordionContent>{item.resposta}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
