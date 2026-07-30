import type { Metadata } from "next";

import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";

export const metadata: Metadata = {
  title: "Dentyvo — Gestão odontológica com secretária virtual no WhatsApp",
  description:
    "Agendamento, prontuário e uma secretária virtual no WhatsApp que atende por você — mesmo quando não há ninguém na recepção.",
};

export default function MarketingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-background text-foreground">
      <MarketingHeader />
      <div className="flex-1">{children}</div>
      <MarketingFooter />
    </div>
  );
}
