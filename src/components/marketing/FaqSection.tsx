import { SectionReveal } from "@/components/marketing/SectionReveal";

const faqs = [
  {
    pergunta: "Preciso de cartão de crédito para começar?",
    resposta:
      "Não. O MVP usa assinatura via PIX após o trial. Você testa a clínica antes de pagar.",
  },
  {
    pergunta: "A secretária virtual substitui a recepção?",
    resposta:
      "Não substitui a equipe — ela cobre confirmações e respostas frequentes no WhatsApp quando a recepção está ocupada ou fora do horário de pico.",
  },
  {
    pergunta: "O que muda depois dos 12 meses da promoção?",
    resposta:
      "As 30 primeiras clínicas no Básico ou Médio migram automaticamente para o preço cheio do plano. Avisamos com antecedência antes da mudança.",
  },
  {
    pergunta: "Posso ter mais de um profissional?",
    resposta:
      "Sim. O plano Full inclui profissionais ilimitados; nos demais, os limites seguem o plano escolhido.",
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

        <div className="mt-10 space-y-3">
          {faqs.map((item) => (
            <details
              key={item.pergunta}
              className="group rounded-[var(--radius-lg)] border border-border bg-background px-4 py-3 open:shadow-[var(--shadow-sm)]"
            >
              <summary className="cursor-pointer list-none text-sm font-semibold leading-6 text-foreground marker:content-none [&::-webkit-details-marker]:hidden">
                <span className="flex items-center justify-between gap-3">
                  {item.pergunta}
                  <span
                    aria-hidden
                    className="text-muted-foreground transition-transform duration-[var(--duration-fast)] group-open:rotate-45"
                  >
                    +
                  </span>
                </span>
              </summary>
              <p className="mt-3 pb-1 text-sm leading-[22px] text-muted-foreground">
                {item.resposta}
              </p>
            </details>
          ))}
        </div>
      </div>
    </SectionReveal>
  );
}
