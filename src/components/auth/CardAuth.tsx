"use client";

import Link from "next/link";
import Image from "next/image";
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
  /**
   * Rodapé passivo com links legais. Desligar no cadastro quando o
   * formulário exige checkbox explícito de aceite (confirmação ativa).
   */
  showLegalFooter?: boolean;
};

/**
 * Card padrão das páginas de auth (DESIGN_SYSTEM §18).
 */
export function CardAuth({
  title,
  description,
  content,
  showLegalFooter = true,
}: CardAuthProps) {
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

      {showLegalFooter ? (
        <CardFooter className="justify-center gap-4 border-t border-border pt-4 text-center text-xs text-muted-foreground">
          <p>
            Ao continuar, você concorda com os{" "}
            <Link
              href="/termos"
              className="inline-flex items-center text-primary underline-offset-4 hover:underline"
            >
              Termos de uso
            </Link>{" "}
            e a{" "}
            <Link
              href="/privacidade"
              className="inline-flex items-center text-primary underline-offset-4 hover:underline"
            >
              Política de Privacidade
            </Link>
            .
          </p>
        </CardFooter>
      ) : null}
    </Card>
  );
}
