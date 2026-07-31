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
import Image from "next/image";

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
    <Card className="shadow-(--shadow-md)">
      <CardHeader className="items-center text-center">
        <Image
          src="/dentyvo-logo-nome.png"
          alt="Dentyvo"
          width={1626}
          height={448}
          className="w-[200px] py-4"
          style={{ height: "auto" }}
          loading="eager"
          priority
        />
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
        <p>Ao continuar, você concorda com os <Link
          href="/termos"
          className="inline-flex items-center text-primary underline-offset-4 hover:underline"
        >
          Termos de uso
        </Link> e a <Link
          href="/privacidade"
          className="inline-flex items-center text-primary underline-offset-4 hover:underline"
        >
          Política de Privacidade
        </Link>.</p>
      </CardFooter>
    </Card>
  );
}
