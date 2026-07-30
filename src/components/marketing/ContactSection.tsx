"use client";

import { Mail, MessageCircle } from "lucide-react";
import type { FormEvent } from "react";

import { SectionReveal } from "@/components/marketing/SectionReveal";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { cn } from "@/lib/cn";

const CONTATO_EMAIL = "contato@dentyvo.com.br";

/** Número comercial a confirmar antes do lançamento. */
const WHATSAPP_COMERCIAL = {
  url: "https://wa.me/5511999999999",
  label: "WhatsApp comercial",
} as const;

const fieldClassName = cn(
  "h-11 w-full rounded-[var(--radius-md)] border border-input bg-card px-3",
  "text-sm text-foreground shadow-[var(--shadow-sm)]",
  "placeholder:text-muted-foreground",
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
  "disabled:cursor-not-allowed disabled:opacity-50",
);

const labelClassName =
  "text-[13px] font-medium leading-[18px] text-foreground";

/**
 * Contato da landing — antes do rodapé.
 *
 * TODO(contato-backend): conectar o envio real quando existir backend/spec
 * de formulário de contato (ainda não modelado em specs/features).
 * Por enquanto o formulário é apenas visual e o submit não envia dados.
 */
export function ContactSection() {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // TODO(contato-backend): chamar server action / use case de contato.
  }

  return (
    <SectionReveal
      id="contato"
      aria-labelledby="contato-heading"
      className="scroll-mt-20 border-b border-border"
      duration="component"
      yOffset={16}
    >
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:gap-14">
          <div>
            <p className="text-[11px] font-semibold tracking-wide text-primary uppercase">
              Contato
            </p>
            <h2
              id="contato-heading"
              className="mt-3 text-2xl leading-8 font-bold tracking-tight sm:text-3xl"
            >
              Fale com a Dentyvo
            </h2>
            <p className="mt-4 text-base leading-7 text-muted-foreground">
              Dúvidas sobre planos, trial, onboarding ou vendas? Envie uma
              mensagem ou fale direto pelos canais abaixo.
            </p>

            <ul className="mt-8 space-y-4">
              <li>
                <a
                  href={`mailto:${CONTATO_EMAIL}`}
                  className="flex min-h-11 items-center gap-3 rounded-[var(--radius-md)] border border-border bg-card px-4 py-3 text-sm text-foreground shadow-[var(--shadow-sm)] hover:border-primary/30"
                >
                  <span className="brand-gradient flex size-9 shrink-0 items-center justify-center rounded-[var(--radius-md)] text-primary-foreground">
                    <Mail className="size-[18px]" aria-hidden strokeWidth={1.75} />
                  </span>
                  <span>
                    <span className="block text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                      E-mail
                    </span>
                    <span className="font-medium">{CONTATO_EMAIL}</span>
                  </span>
                </a>
              </li>
              <li>
                <a
                  href={WHATSAPP_COMERCIAL.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex min-h-11 items-center gap-3 rounded-[var(--radius-md)] border border-border bg-card px-4 py-3 text-sm text-foreground shadow-[var(--shadow-sm)] hover:border-primary/30"
                >
                  <span className="brand-gradient flex size-9 shrink-0 items-center justify-center rounded-[var(--radius-md)] text-primary-foreground">
                    <MessageCircle
                      className="size-[18px]"
                      aria-hidden
                      strokeWidth={1.75}
                    />
                  </span>
                  <span>
                    <span className="block text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                      WhatsApp
                    </span>
                    <span className="font-medium">
                      {WHATSAPP_COMERCIAL.label}
                    </span>
                  </span>
                </a>
              </li>
            </ul>

            <div className="mt-6">
              <ButtonLink
                href="/cadastro"
                variant="outline"
                size="lg"
                className="min-h-11"
              >
                Começar trial grátis
              </ButtonLink>
            </div>
          </div>

          <div className="rounded-[var(--radius-xl)] border border-border bg-card p-6 shadow-[var(--shadow-sm)] sm:p-8">
            <h3 className="text-lg font-semibold tracking-tight text-foreground">
              Envie uma mensagem
            </h3>
            <p className="mt-2 text-sm leading-[22px] text-muted-foreground">
              Contato geral ou comercial. Responderemos pelo e-mail informado.
            </p>

            <form
              className="mt-6 space-y-5"
              onSubmit={handleSubmit}
              noValidate
            >
              <div className="space-y-1.5">
                <label htmlFor="contato-nome" className={labelClassName}>
                  Nome
                </label>
                <input
                  id="contato-nome"
                  name="nome"
                  type="text"
                  autoComplete="name"
                  placeholder="Seu nome"
                  className={fieldClassName}
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="contato-email" className={labelClassName}>
                  E-mail
                </label>
                <input
                  id="contato-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  placeholder="voce@clinica.com.br"
                  className={fieldClassName}
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="contato-mensagem" className={labelClassName}>
                  Mensagem
                </label>
                <textarea
                  id="contato-mensagem"
                  name="mensagem"
                  rows={5}
                  placeholder="Como podemos ajudar?"
                  className={cn(
                    fieldClassName,
                    "h-auto min-h-[120px] resize-y py-2.5",
                  )}
                />
              </div>

              <Button type="submit" variant="primary" size="lg" className="min-h-11 w-full sm:w-auto">
                Enviar mensagem
              </Button>
              <p className="text-xs leading-[18px] text-muted-foreground">
                O envio ainda não está conectado ao servidor — em breve.
              </p>
            </form>
          </div>
        </div>
      </div>
    </SectionReveal>
  );
}
