import { SectionReveal } from "@/components/marketing/SectionReveal";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    pergunta: "Preciso instalar algum programa?",
    resposta:
      "Não, a Dentyvo funciona inteiramente pelo navegador, sem instalação.",
  },
  {
    pergunta: "Como funciona o período de teste?",
    resposta:
      "14 dias gratuitos, sem necessidade de cartão de crédito para começar.",
  },
  {
    pergunta: "A secretária virtual do WhatsApp substitui minha recepcionista?",
    resposta:
      "Não, ela trabalha junto com sua equipe, atendendo automaticamente fora do horário ou quando não há ninguém disponível.",
  },
  {
    pergunta: "Meus dados e os dos meus pacientes estão seguros?",
    resposta:
      "Sim, seguimos princípios de proteção de dados de saúde (LGPD), com controle de acesso e auditoria completos.",
  },
  {
    pergunta: "Posso mudar de plano depois?",
    resposta:
      "Sim, você pode fazer upgrade ou downgrade a qualquer momento pelo painel.",
  },
  {
    pergunta: "Como funciona a promoção de lançamento?",
    resposta:
      "As 30 primeiras clínicas garantem desconto nos planos Básico e Médio pelos primeiros 12 meses.",
  },
] as const;

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

        <Accordion
          type="single"
          collapsible
          className="mt-10 rounded-[var(--radius-lg)] border border-border bg-background px-4 shadow-[var(--shadow-sm)] sm:px-5"
        >
          {faqs.map((item, index) => (
            <AccordionItem key={item.pergunta} value={`faq-${index}`}>
              <AccordionTrigger>{item.pergunta}</AccordionTrigger>
              <AccordionContent>{item.resposta}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </SectionReveal>
  );
}
