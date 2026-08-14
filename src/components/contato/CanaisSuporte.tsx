import { Mail, MessageCircle } from "lucide-react";

import { CONTATO_EMAIL, WHATSAPP_COMERCIAL } from "@/lib/contato/canais";
import { cn } from "@/lib/utils";

type CanaisSuporteProps = {
  className?: string;
};

export function CanaisSuporte({ className }: CanaisSuporteProps) {
  return (
    <ul className={cn("space-y-4", className)}>
      <li>
        <a
          href={`mailto:${CONTATO_EMAIL}`}
          className="flex min-h-11 items-center gap-3 rounded-md border border-border bg-card px-4 py-3 text-sm text-foreground shadow-(--shadow-sm) hover:border-primary/30"
        >
          <span className="brand-gradient flex size-9 shrink-0 items-center justify-center rounded-md text-primary-foreground">
            <Mail className="size-4.5" aria-hidden strokeWidth={1.75} />
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
          className="flex min-h-11 items-center gap-3 rounded-md border border-border bg-card px-4 py-3 text-sm text-foreground shadow-(--shadow-sm) hover:border-primary/30"
        >
          <span className="brand-gradient flex size-9 shrink-0 items-center justify-center rounded-md text-primary-foreground">
            <MessageCircle
              className="size-4.5"
              aria-hidden
              strokeWidth={1.75}
            />
          </span>
          <span>
            <span className="block text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
              WhatsApp
            </span>
            <span className="font-medium">{WHATSAPP_COMERCIAL.label}</span>
          </span>
        </a>
      </li>
    </ul>
  );
}
