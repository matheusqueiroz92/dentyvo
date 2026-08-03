"use client";

import { CalendarPlus, UserPlus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

export function AtalhosRapidos() {
  const router = useRouter();

  return (
    <section aria-labelledby="atalhos-rapidos-titulo" className="space-y-3">
      <h2
        id="atalhos-rapidos-titulo"
        className="text-base font-semibold text-foreground"
      >
        Atalhos rápidos
      </h2>
      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          variant="primary"
          className="min-h-11"
          onClick={() => router.push("/agenda?nova=1")}
        >
          <CalendarPlus aria-hidden />
          Nova consulta
        </Button>
        <Button asChild variant="outline" className="min-h-11">
          <Link href="/pacientes">
            <UserPlus aria-hidden />
            Novo paciente
          </Link>
        </Button>
      </div>
    </section>
  );
}
