import type { Metadata } from "next";

import { Footer } from "@/components/marketing/Footer";
import { Header } from "@/components/marketing/Header";
import { SmoothScrollProvider } from "@/components/marketing/SmoothScrollProvider";

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
    <SmoothScrollProvider>
      <div className="flex min-h-full flex-1 flex-col bg-background text-foreground">
        <Header />
        <div className="flex-1">{children}</div>
        <Footer />
      </div>
    </SmoothScrollProvider>
  );
}
