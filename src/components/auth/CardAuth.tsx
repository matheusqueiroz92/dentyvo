"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export type CardAuthDescription = {
  text: string;
  link?: { href: string; label: string };
};

export type CardAuthProps = {
  title: string;
  description: CardAuthDescription;
  content: ReactNode;
};

/**
 * Card padrão das páginas de auth (DESIGN_SYSTEM §18).
 * Wordmark tipográfica até o logo final ser aprovado.
 */
export function CardAuth({ title, description, content }: CardAuthProps) {
  return (
    <Card className="shadow-[var(--shadow-md)]">
      <CardHeader className="items-center text-center">
        <p className="font-sans text-2xl font-bold tracking-tight text-foreground">
          Dentyvo
        </p>
        <CardTitle className="mt-4 text-xl">{title}</CardTitle>
        <CardDescription className="text-center">
          {description.text}
          {description.link ? (
            <>
              {" "}
              <Link
                href={description.link.href}
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                {description.link.label}
              </Link>
            </>
          ) : null}
        </CardDescription>
      </CardHeader>

      <CardContent>{content}</CardContent>

      <CardFooter className="justify-center gap-4 border-t border-border pt-4 text-center text-xs text-muted-foreground">
        <Link
          href="/termos"
          className="min-h-11 inline-flex items-center underline-offset-4 hover:underline"
        >
          Termos de uso
        </Link>
        <span aria-hidden>·</span>
        <Link
          href="/privacidade"
          className="min-h-11 inline-flex items-center underline-offset-4 hover:underline"
        >
          Privacidade
        </Link>
      </CardFooter>
    </Card>
  );
}
