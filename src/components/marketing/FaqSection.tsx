import { FaqAccordion } from "@/components/contato/FaqAccordion";
import { SectionReveal } from "@/components/marketing/SectionReveal";
import { FAQS_LANDING } from "@/lib/ajuda/faq";

export function FaqSection() {
  return (
    <SectionReveal
      id="faq"
      aria-labelledby="faq-heading"
      className="scroll-mt-20 border-b border-border bg-card"
      duration="component"
      yOffset={20}
    >
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="text-center">
          <p className="text-[11px] font-semibold tracking-wide text-primary uppercase">
            FAQ
          </p>
          <h2
            id="faq-heading"
            className="mt-3 text-2xl leading-8 font-bold tracking-tight sm:text-3xl"
          >
            Perguntas frequentes
          </h2>
        </div>

        <FaqAccordion items={FAQS_LANDING} className="mt-10" />
      </div>
    </SectionReveal>
  );
}
