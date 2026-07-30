import {
  CalendarDays,
  ClipboardPlus,
  FileSpreadsheet,
  FolderOpen,
  MessageCircle,
  PenLine,
  Sparkles,
} from "lucide-react";

import { SectionReveal } from "@/components/marketing/SectionReveal";

export function ProblemSection() {
  return (
    <SectionReveal
      id="problema"
      aria-labelledby="problema-heading"
      className="scroll-mt-20 border-b border-border bg-card"
      duration="component"
      yOffset={20}
    >
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="max-w-3xl">
          <p className="text-[11px] font-semibold tracking-wide text-primary uppercase">
            O problema
          </p>
          <h2
            id="problema-heading"
            className="mt-3 text-2xl leading-8 font-bold tracking-tight sm:text-3xl sm:leading-9"
          >
            Papel, planilha, retrabalho. Você conhece bem.
          </h2>
          <p className="mt-4 text-base leading-7 text-muted-foreground">
            Muitas clínicas ainda perdem tempo precioso preenchendo anamnese à
            mão, procurando prontuário em pasta física, ou tentando lembrar quem
            confirmou a consulta de amanhã. A Dentyvo resolve isso.
          </p>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2">
          <div className="rounded-[var(--radius-lg)] border border-border bg-background p-6">
            <p className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
              <PenLine className="size-[18px]" aria-hidden strokeWidth={1.75} />
              Antes
            </p>
            <ul className="mt-4 space-y-4">
              <li className="flex gap-3 text-sm leading-[22px]">
                <FileSpreadsheet
                  className="mt-0.5 size-[18px] shrink-0 text-warning"
                  aria-hidden
                  strokeWidth={1.75}
                />
                <span>Anamnese em papel ou planilha, fácil de perder.</span>
              </li>
              <li className="flex gap-3 text-sm leading-[22px]">
                <FolderOpen
                  className="mt-0.5 size-[18px] shrink-0 text-warning"
                  aria-hidden
                  strokeWidth={1.75}
                />
                <span>
                  Prontuário em pasta física, difícil de achar na hora.
                </span>
              </li>
              <li className="flex gap-3 text-sm leading-[22px]">
                <MessageCircle
                  className="mt-0.5 size-[18px] shrink-0 text-warning"
                  aria-hidden
                  strokeWidth={1.75}
                />
                <span>
                  WhatsApp da clínica parado quando a recepção está ocupada.
                </span>
              </li>
            </ul>
          </div>

          <div className="rounded-[var(--radius-lg)] border border-primary/25 bg-[hsl(var(--info-subtle))] p-6">
            <p className="flex items-center gap-2 text-sm font-semibold text-[hsl(var(--info-subtle-foreground))]">
              <Sparkles
                className="size-[18px]"
                aria-hidden
                strokeWidth={1.75}
              />
              Com a Dentyvo
            </p>
            <ul className="mt-4 space-y-4">
              <li className="flex gap-3 text-sm leading-[22px] text-foreground">
                <ClipboardPlus
                  className="mt-0.5 size-[18px] shrink-0 text-success"
                  aria-hidden
                  strokeWidth={1.75}
                />
                <span>Anamnese e prontuário digitais, sempre à mão.</span>
              </li>
              <li className="flex gap-3 text-sm leading-[22px] text-foreground">
                <CalendarDays
                  className="mt-0.5 size-[18px] shrink-0 text-success"
                  aria-hidden
                  strokeWidth={1.75}
                />
                <span>
                  Agenda com confirmações visíveis para toda a equipe.
                </span>
              </li>
              <li className="flex gap-3 text-sm leading-[22px] text-foreground">
                <MessageCircle
                  className="mt-0.5 size-[18px] shrink-0 text-success"
                  aria-hidden
                  strokeWidth={1.75}
                />
                <span>
                  Secretária virtual que responde mesmo fora do horário de pico.
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </SectionReveal>
  );
}
