import { CalendarPlus, UserPlus } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export function AtalhosRapidos() {
  return (
    <section aria-labelledby="atalhos-rapidos-titulo" className="space-y-3">
      <h2
        id="atalhos-rapidos-titulo"
        className="text-base font-semibold text-foreground"
      >
        Atalhos rápidos
      </h2>
      <div className="flex flex-wrap gap-3">
        <Button asChild variant="primary" className="min-h-11">
          <Link href="/agenda">
            <CalendarPlus aria-hidden />
            Nova consulta
          </Link>
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
