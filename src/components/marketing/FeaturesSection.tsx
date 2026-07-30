import {
  CalendarDays,
  MessageCircle,
  ScanLine,
  WalletCards,
} from "lucide-react";

import { SectionReveal } from "@/components/marketing/SectionReveal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const features = [
  {
    title: "Agendamento inteligente",
    description:
      "Organize a agenda da clínica sem overbooking. Confirmações e remarcações ficam claras para a equipe.",
    icon: CalendarDays,
  },
  {
    title: "Prontuário digital completo",
    description:
      "Anamnese, evoluções, odontograma e periograma no mesmo lugar — sem pasta física nem retrabalho.",
    icon: ScanLine,
  },
  {
    title: "Secretária virtual via WhatsApp",
    description:
      "Um bot que responde pacientes, confirma consultas e reduz a fila de mensagens na recepção.",
    icon: MessageCircle,
  },
  {
    title: "Assinatura simples com PIX",
    description:
      "Comece com trial, assine pelo PIX e acompanhe o status da assinatura sem burocracia de plataforma grande.",
    icon: WalletCards,
  },
] as const;

export function FeaturesSection() {
  return (
    <SectionReveal
      id="recursos"
      aria-labelledby="recursos-heading"
      className="scroll-mt-20 border-b border-border"
      duration="component"
      yOffset={20}
    >
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-[11px] font-semibold tracking-wide text-primary uppercase">
            Recursos
          </p>
          <h2
            id="recursos-heading"
            className="mt-3 text-2xl leading-8 font-bold tracking-tight sm:text-3xl"
          >
            Tudo que a clínica precisa no dia a dia
          </h2>
          <p className="mt-4 text-base leading-7 text-muted-foreground">
            Do primeiro contato no WhatsApp até o prontuário completo — sem
            espalhar a operação em ferramentas desconectadas.
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card
                key={feature.title}
                className="h-full shadow-[var(--shadow-sm)]"
              >
                <CardHeader>
                  <div className="brand-gradient mb-2 flex size-10 items-center justify-center rounded-[var(--radius-md)] text-primary-foreground">
                    <Icon className="size-5" aria-hidden strokeWidth={1.75} />
                  </div>
                  <CardTitle className="text-lg leading-7">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-[22px] text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </SectionReveal>
  );
}
